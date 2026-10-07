"""
SERIALIZADORES DE CAJA Y RECIBOS DE PAGO (apps/comercial/serializers/caja.py)

Define los serializadores para la gestión de ingresos en caja y desglose contable:
- DetallePagoReciboSerializer
- ReciboPagoSerializer (con lógica de aplicación en cascada y transacciones atómicas)
"""

from rest_framework import serializers
from django.db import transaction
from django.db.models import Q, Sum
from datetime import date
from decimal import Decimal

from ..models import ReciboPago, DetallePagoRecibo, EstadoContrato
from apps.cuentas.models import Usuario, Bitacora


class DetallePagoReciboSerializer(serializers.ModelSerializer):
    """
    Serializador para el desglose contable de los cobros aplicados en recibos de caja.
    """
    class Meta:
        model = DetallePagoRecibo
        fields = '__all__'
        read_only_fields = ['id_detalle', 'recibo']


class ReciboPagoSerializer(serializers.ModelSerializer):
    """
    Serializador de Recibos de Pago de Caja.
    Aplica pagos en cascada sobre cuotas vencidas/pendientes y mantenimientos anuales.
    """
    usuario_cajero = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False
    )
    detalles = DetallePagoReciboSerializer(many=True, required=False)
    usuario_cajero_nombre = serializers.SerializerMethodField()
    contrato_numero = serializers.CharField(source='contrato.numero_contrato', read_only=True)

    class Meta:
        model = ReciboPago
        fields = [
            'id_recibo',
            'contrato',
            'contrato_numero',
            'usuario_cajero',
            'usuario_cajero_nombre',
            'correlativo_recibo',
            'fecha_transaccion',
            'monto_ingresado',
            'metodo_pago',
            'numero_boleta_banco',
            'observaciones',
            'detalles'
        ]
        read_only_fields = ['id_recibo', 'correlativo_recibo', 'fecha_transaccion']

    def get_usuario_cajero_nombre(self, obj):
        if obj.usuario_cajero:
            return obj.usuario_cajero.get_full_name() or obj.usuario_cajero.username
        return ""

    def validate(self, attrs):
        contrato = attrs.get('contrato')
        detalles = attrs.get('detalles', [])
        if contrato:
            for item in detalles:
                concepto = item.get('concepto')
                if concepto == 'OTRO':
                    raise serializers.ValidationError({
                        'detalles': "El concepto 'Otro Concepto' ha sido deshabilitado."
                    })
                elif concepto == 'ENGANCHE':
                    if DetallePagoRecibo.objects.filter(recibo__contrato=contrato, concepto='ENGANCHE').exists():
                        raise serializers.ValidationError({
                            'detalles': 'El Enganche Inicial de este contrato ya fue pagado previamente.'
                        })
                elif concepto == 'MANTENIMIENTO_ANUAL':
                    mantes_pendientes = contrato.control_mantenimientos.filter(estado_cobro__in=['PENDIENTE', 'EN_MORA']).exists()
                    if not mantes_pendientes:
                        raise serializers.ValidationError({
                            'detalles': 'No existen cuotas de mantenimiento anual pendientes de pago para este contrato.'
                        })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        request = self.context.get('request')

        # Si el cajero no se pasó explícitamente, usar el usuario de la petición
        if 'usuario_cajero' not in validated_data and request and request.user and not request.user.is_anonymous:
            validated_data['usuario_cajero'] = request.user

        recibo = ReciboPago.objects.create(**validated_data)
        contrato = recibo.contrato

        if detalles_data:
            for item in detalles_data:
                concepto = item.get('concepto')
                monto_item = Decimal(str(item.get('monto_aplicado') or recibo.monto_ingresado))

                if concepto == 'CUOTA_AMORTIZACION':
                    plan_cuota_especifica = item.get('plan_cuota')
                    if plan_cuota_especifica:
                        cuotas_a_procesar = contrato.plan_cuotas.filter(
                            Q(pk=plan_cuota_especifica.pk) | Q(estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL'])
                        ).order_by('numero_cuota')
                    else:
                        cuotas_a_procesar = contrato.plan_cuotas.filter(
                            estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL']
                        ).order_by('numero_cuota')

                    monto_disponible = monto_item
                    cuota_procesada = False

                    for cuota in cuotas_a_procesar:
                        if monto_disponible <= Decimal('0.00'):
                            break
                        if cuota.estado_cuota == 'PAGADA':
                            continue

                        total_pagado_previo = cuota.detalles_recibo.aggregate(
                            total=Sum('monto_aplicado')
                        )['total'] or Decimal('0.00')

                        saldo_pendiente_cuota = max(Decimal('0.00'), cuota.monto_cuota - total_pagado_previo)
                        if saldo_pendiente_cuota <= Decimal('0.00'):
                            cuota.estado_cuota = 'PAGADA'
                            cuota.save()
                            continue

                        monto_cobertura = min(monto_disponible, saldo_pendiente_cuota)
                        nuevo_total_pagado = total_pagado_previo + monto_cobertura

                        if nuevo_total_pagado >= cuota.monto_cuota:
                            cuota.estado_cuota = 'PAGADA'
                        elif nuevo_total_pagado > Decimal('0.00'):
                            cuota.estado_cuota = 'PARCIAL'
                        else:
                            cuota.estado_cuota = 'PENDIENTE'
                        cuota.save()

                        DetallePagoRecibo.objects.create(
                            recibo=recibo,
                            plan_cuota=cuota,
                            concepto='CUOTA_AMORTIZACION',
                            monto_aplicado=monto_cobertura
                        )
                        monto_disponible -= monto_cobertura
                        cuota_procesada = True

                    if not cuota_procesada:
                        DetallePagoRecibo.objects.create(
                            recibo=recibo,
                            concepto='CUOTA_AMORTIZACION',
                            monto_aplicado=monto_item
                        )

                elif concepto == 'MANTENIMIENTO_ANUAL':
                    mante_especifico = item.get('control_mantenimiento')
                    if mante_especifico:
                        mantes_a_procesar = contrato.control_mantenimientos.filter(
                            Q(pk=mante_especifico.pk) | Q(estado_cobro__in=['PENDIENTE', 'EN_MORA'])
                        ).order_by('anio_periodo')
                    else:
                        mantes_a_procesar = contrato.control_mantenimientos.filter(
                            estado_cobro__in=['PENDIENTE', 'EN_MORA']
                        ).order_by('anio_periodo')

                    monto_disponible = monto_item
                    mante_procesado = False

                    for mante in mantes_a_procesar:
                        if monto_disponible <= Decimal('0.00'):
                            break
                        if mante.estado_cobro == 'PAGADO':
                            continue

                        monto_cobertura = min(monto_disponible, mante.monto_mantenimiento)
                        mante.estado_cobro = 'PAGADO'
                        mante.fecha_pago_real = date.today()
                        mante.save()

                        DetallePagoRecibo.objects.create(
                            recibo=recibo,
                            control_mantenimiento=mante,
                            concepto='MANTENIMIENTO_ANUAL',
                            monto_aplicado=monto_cobertura
                        )
                        monto_disponible -= monto_cobertura
                        mante_procesado = True

                    if not mante_procesado:
                        DetallePagoRecibo.objects.create(
                            recibo=recibo,
                            concepto='MANTENIMIENTO_ANUAL',
                            monto_aplicado=monto_item
                        )
                elif concepto == 'ENGANCHE':
                    DetallePagoRecibo.objects.create(recibo=recibo, **item)
                    # Regla b: Al realizar el pago del Enganche Inicial, el estado del contrato pasa a Activo
                    estado_activo = EstadoContrato.objects.filter(nombre_estado_contrato='Activo').first()
                    if estado_activo and contrato.estado_contrato != estado_activo:
                        contrato.estado_contrato = estado_activo

                    # Si el enganche en el contrato era menor al abonado (ej. contrato iniciado con Q0), actualizar enganche y saldo a financiar
                    if contrato.monto_enganche < monto_item:
                        contrato.monto_enganche = monto_item
                        contrato.monto_financiar = max(Decimal('0.00'), contrato.monto_total - contrato.monto_enganche)
                        contrato.save(update_fields=['estado_contrato', 'monto_enganche', 'monto_financiar'])
                    else:
                        contrato.save(update_fields=['estado_contrato'])
                else:
                    DetallePagoRecibo.objects.create(recibo=recibo, **item)
        else:
            cuotas_pendientes = contrato.plan_cuotas.filter(
                estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL']
            ).order_by('numero_cuota')

            monto_disponible = Decimal(str(recibo.monto_ingresado))
            for cuota in cuotas_pendientes:
                if monto_disponible <= Decimal('0.00'):
                    break
                if cuota.estado_cuota == 'PAGADA':
                    continue

                total_pagado_previo = cuota.detalles_recibo.aggregate(
                    total=Sum('monto_aplicado')
                )['total'] or Decimal('0.00')

                saldo_pendiente_cuota = max(Decimal('0.00'), cuota.monto_cuota - total_pagado_previo)
                if saldo_pendiente_cuota <= Decimal('0.00'):
                    cuota.estado_cuota = 'PAGADA'
                    cuota.save()
                    continue

                monto_cobertura = min(monto_disponible, saldo_pendiente_cuota)
                nuevo_total_pagado = total_pagado_previo + monto_cobertura

                if nuevo_total_pagado >= cuota.monto_cuota:
                    cuota.estado_cuota = 'PAGADA'
                elif nuevo_total_pagado > Decimal('0.00'):
                    cuota.estado_cuota = 'PARCIAL'
                else:
                    cuota.estado_cuota = 'PENDIENTE'
                cuota.save()

                DetallePagoRecibo.objects.create(
                    recibo=recibo,
                    plan_cuota=cuota,
                    concepto='CUOTA_AMORTIZACION',
                    monto_aplicado=monto_cobertura
                )
                monto_disponible -= monto_cobertura

        # Regla c: Evaluar auto-liquidación de contrato si el valor del inmueble está 100% pagado
        estado_liquidado = EstadoContrato.objects.filter(nombre_estado_contrato='Liquidado').first()
        if estado_liquidado:
            if contrato.modalidad.aplica_credito and contrato.plan_cuotas.count() > 0:
                cuotas_pendientes = contrato.plan_cuotas.filter(estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL']).count()
                enganche_pendiente = (contrato.monto_enganche > 0 and not DetallePagoRecibo.objects.filter(recibo__contrato=contrato, concepto='ENGANCHE').exists())
                if cuotas_pendientes == 0 and not enganche_pendiente:
                    contrato.estado_contrato = estado_liquidado
                    contrato.save(update_fields=['estado_contrato'])
            elif not contrato.modalidad.aplica_credito:
                total_pagado_inmueble = DetallePagoRecibo.objects.filter(
                    recibo__contrato=contrato,
                    concepto='ENGANCHE'
                ).aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')
                if total_pagado_inmueble >= contrato.monto_total:
                    contrato.estado_contrato = estado_liquidado
                    contrato.save(update_fields=['estado_contrato'])

        # Bitácora
        Bitacora.objects.create(
            usuario=recibo.usuario_cajero,
            tabla_afectada='comercial_recibo_pago',
            accion='INSERT',
            registro_id=recibo.id_recibo,
            datos_nuevos={
                'correlativo_recibo': recibo.correlativo_recibo,
                'contrato': recibo.contrato.numero_contrato,
                'monto_ingresado': str(recibo.monto_ingresado),
                'metodo_pago': recibo.metodo_pago
            }
        )

        return recibo

    @transaction.atomic
    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)
        nuevo_monto = validated_data.get('monto_ingresado', instance.monto_ingresado)
        monto_cambio = (Decimal(str(nuevo_monto)) != Decimal(str(instance.monto_ingresado)))

        # Actualizar atributos directos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si cambió el monto ingresado, recalcular automáticamente las cuotas/mantenimientos cubiertos
        if monto_cambio:
            contrato = instance.contrato

            # 1. Obtener cuotas y mantenimientos vinculados previamente a este recibo
            cuotas_afectadas = list(set([det.plan_cuota for det in instance.detalles.all() if det.plan_cuota]))
            mantes_afectados = list(set([det.control_mantenimiento for det in instance.detalles.all() if det.control_mantenimiento]))

            # 2. Eliminar los desgloses antiguos de este recibo
            instance.detalles.all().delete()

            # 3. Restaurar estado de cuotas afectadas según los pagos restantes
            for cuota in cuotas_afectadas:
                total_pagado = cuota.detalles_recibo.aggregate(
                    total=Sum('monto_aplicado')
                )['total'] or Decimal('0.00')
                if total_pagado >= cuota.monto_cuota:
                    cuota.estado_cuota = 'PAGADA'
                elif total_pagado > Decimal('0.00'):
                    cuota.estado_cuota = 'PARCIAL'
                else:
                    cuota.estado_cuota = 'PENDIENTE'
                cuota.save()

            for mante in mantes_afectados:
                mante.estado_cobro = 'PENDIENTE'
                mante.fecha_pago_real = None
                mante.save()

            # 4. Aplicar el nuevo monto en cascada sobre cuotas impagas
            cuotas_pendientes = contrato.plan_cuotas.filter(
                estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL']
            ).order_by('numero_cuota')

            monto_disponible = Decimal(str(instance.monto_ingresado))
            for cuota in cuotas_pendientes:
                if monto_disponible <= Decimal('0.00'):
                    break
                if cuota.estado_cuota == 'PAGADA':
                    continue

                total_pagado_previo = cuota.detalles_recibo.aggregate(
                    total=Sum('monto_aplicado')
                )['total'] or Decimal('0.00')

                saldo_pendiente_cuota = max(Decimal('0.00'), cuota.monto_cuota - total_pagado_previo)
                if saldo_pendiente_cuota <= Decimal('0.00'):
                    cuota.estado_cuota = 'PAGADA'
                    cuota.save()
                    continue

                monto_cobertura = min(monto_disponible, saldo_pendiente_cuota)
                nuevo_total_pagado = total_pagado_previo + monto_cobertura

                if nuevo_total_pagado >= cuota.monto_cuota:
                    cuota.estado_cuota = 'PAGADA'
                elif nuevo_total_pagado > Decimal('0.00'):
                    cuota.estado_cuota = 'PARCIAL'
                else:
                    cuota.estado_cuota = 'PENDIENTE'
                cuota.save()

                DetallePagoRecibo.objects.create(
                    recibo=instance,
                    plan_cuota=cuota,
                    concepto='CUOTA_AMORTIZACION',
                    monto_aplicado=monto_cobertura
                )
                monto_disponible -= monto_cobertura

            # 5. Actualizar el estado del contrato si cambió su estado de liquidación
            if contrato.modalidad.aplica_credito and contrato.plan_cuotas.count() > 0:
                pendientes = contrato.plan_cuotas.filter(estado_cuota__in=['PENDIENTE', 'VENCIDA', 'PARCIAL']).count()
                if pendientes == 0:
                    estado_liq = EstadoContrato.objects.filter(nombre_estado_contrato='Liquidado').first()
                    if estado_liq and contrato.estado_contrato != estado_liq:
                        contrato.estado_contrato = estado_liq
                        contrato.save(update_fields=['estado_contrato'])
                else:
                    estado_act = EstadoContrato.objects.filter(nombre_estado_contrato='Activo').first()
                    if estado_act and contrato.estado_contrato.nombre_estado_contrato == 'Liquidado':
                        contrato.estado_contrato = estado_act
                        contrato.save(update_fields=['estado_contrato'])

        # Bitácora
        request = self.context.get('request')
        usuario = request.user if (request and request.user and not request.user.is_anonymous) else instance.usuario_cajero
        Bitacora.objects.create(
            usuario=usuario,
            tabla_afectada='comercial_recibo_pago',
            accion='UPDATE',
            registro_id=instance.id_recibo,
            datos_nuevos={
                'correlativo_recibo': instance.correlativo_recibo,
                'monto_ingresado': str(instance.monto_ingresado),
                'metodo_pago': instance.metodo_pago
            }
        )

        return instance

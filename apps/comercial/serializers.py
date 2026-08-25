"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - SERIALIZADORES DRF (apps/comercial/serializers.py)

Define los serializadores para la manipulación de datos JSON en la API REST:
- ModalidadVentaSerializer
- EstadoContratoSerializer
- DetalleContratoEspacioSerializer
- PlanPagoCuotaSerializer
- ControlMantenimientoSerializer
- DetallePagoReciboSerializer
- ReciboPagoSerializer
- ContratoSerializer (Creación con asignación de espacios y plan de amortización RF-01)
- CotizacionSimuladorSerializer (Simulador de crédito RF-01)
"""

from rest_framework import serializers
from django.db import transaction
from django.db.models import Q
from datetime import date
from dateutil.relativedelta import relativedelta
from decimal import Decimal

from .models import (
    ModalidadVenta,
    EstadoContrato,
    Contrato,
    DetalleContratoEspacio,
    PlanPagoCuota,
    ControlMantenimiento,
    ReciboPago,
    DetallePagoRecibo
)
from apps.cuentas.models import Cliente, Usuario, Bitacora
from apps.inventario.models import EspacioFisico, EstructuraFisica, EstadoEspacio


# ==============================================================================
# 1. SERIALIZADOR MODALIDAD DE VENTA
# ==============================================================================
class ModalidadVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModalidadVenta
        fields = '__all__'


# ==============================================================================
# 2. SERIALIZADOR ESTADO DE CONTRATO
# ==============================================================================
class EstadoContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoContrato
        fields = '__all__'


# ==============================================================================
# 3. SERIALIZADOR DETALLE CONTRATO ESPACIO
# ==============================================================================
class DetalleContratoEspacioSerializer(serializers.ModelSerializer):
    espacio_codigo = serializers.CharField(source='espacio.codigo_unico_espacio', read_only=True)
    estructura_nombre = serializers.CharField(source='espacio.estructura.nombre_estructura', read_only=True)
    sector_nombre = serializers.CharField(source='espacio.estructura.sector.nombre_sector', read_only=True)

    class Meta:
        model = DetalleContratoEspacio
        fields = [
            'id_detalle_contrato',
            'contrato',
            'espacio',
            'espacio_codigo',
            'estructura_nombre',
            'sector_nombre',
            'precio_venta_unitario'
        ]
        read_only_fields = ['id_detalle_contrato']


# ==============================================================================
# 4. SERIALIZADOR PLAN PAGO CUOTA
# ==============================================================================
class PlanPagoCuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPagoCuota
        fields = '__all__'
        read_only_fields = ['id_plan']


# ==============================================================================
# 5. SERIALIZADOR CONTROL MANTENIMIENTO
# ==============================================================================
class ControlMantenimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControlMantenimiento
        fields = '__all__'
        read_only_fields = ['id_control_mante']


# ==============================================================================
# 6. SERIALIZADOR DETALLE PAGO RECIBO
# ==============================================================================
class DetallePagoReciboSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePagoRecibo
        fields = '__all__'
        read_only_fields = ['id_detalle', 'recibo']


# ==============================================================================
# 7. SERIALIZADOR RECIBO DE PAGO (CON TRANSACCIÓN ATÓMICA DE APLICACIÓN DE SALDOS)
# ==============================================================================
class ReciboPagoSerializer(serializers.ModelSerializer):
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
                            Q(pk=plan_cuota_especifica.pk) | Q(estado_cuota__in=['PENDIENTE', 'VENCIDA'])
                        ).order_by('numero_cuota')
                    else:
                        cuotas_a_procesar = contrato.plan_cuotas.filter(
                            estado_cuota__in=['PENDIENTE', 'VENCIDA']
                        ).order_by('numero_cuota')

                    monto_disponible = monto_item
                    cuota_procesada = False

                    for cuota in cuotas_a_procesar:
                        if monto_disponible <= Decimal('0.00'):
                            break
                        if cuota.estado_cuota == 'PAGADA':
                            continue

                        monto_cobertura = min(monto_disponible, cuota.monto_cuota)
                        cuota.estado_cuota = 'PAGADA'
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
                else:
                    DetallePagoRecibo.objects.create(recibo=recibo, **item)
        else:
            cuotas_pendientes = contrato.plan_cuotas.filter(
                estado_cuota__in=['PENDIENTE', 'VENCIDA']
            ).order_by('numero_cuota')

            monto_disponible = Decimal(str(recibo.monto_ingresado))
            for cuota in cuotas_pendientes:
                if monto_disponible <= Decimal('0.00'):
                    break
                monto_cobertura = min(monto_disponible, cuota.monto_cuota)
                cuota.estado_cuota = 'PAGADA'
                cuota.save()

                DetallePagoRecibo.objects.create(
                    recibo=recibo,
                    plan_cuota=cuota,
                    concepto='CUOTA_AMORTIZACION',
                    monto_aplicado=monto_cobertura
                )
                monto_disponible -= monto_cobertura

        # Evaluar auto-liquidación de contrato si todas las cuotas están pagadas
        if contrato.modalidad.aplica_credito and contrato.plan_cuotas.count() > 0:
            if contrato.plan_cuotas.filter(estado_cuota__in=['PENDIENTE', 'VENCIDA']).count() == 0:
                estado_liquidado = EstadoContrato.objects.filter(nombre_estado_contrato='Liquidado').first()
                if estado_liquidado:
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

            # 1. Liberar cuotas y mantenimientos vinculados previamente a este recibo
            for det in instance.detalles.all():
                if det.plan_cuota:
                    det.plan_cuota.estado_cuota = 'PENDIENTE'
                    det.plan_cuota.save()
                if det.control_mantenimiento:
                    det.control_mantenimiento.estado_cobro = 'PENDIENTE'
                    det.control_mantenimiento.fecha_pago_real = None
                    det.control_mantenimiento.save()

            # 2. Eliminar los desgloses antiguos de este recibo
            instance.detalles.all().delete()

            # 3. Aplicar el nuevo monto en cascada sobre cuotas impagas
            cuotas_pendientes = contrato.plan_cuotas.filter(
                estado_cuota__in=['PENDIENTE', 'VENCIDA']
            ).order_by('numero_cuota')

            monto_disponible = Decimal(str(instance.monto_ingresado))
            for cuota in cuotas_pendientes:
                if monto_disponible <= Decimal('0.00'):
                    break
                monto_cobertura = min(monto_disponible, cuota.monto_cuota)
                cuota.estado_cuota = 'PAGADA'
                cuota.save()

                DetallePagoRecibo.objects.create(
                    recibo=instance,
                    plan_cuota=cuota,
                    concepto='CUOTA_AMORTIZACION',
                    monto_aplicado=monto_cobertura
                )
                monto_disponible -= monto_cobertura

            # 4. Actualizar el estado del contrato si cambió su estado de liquidación
            if contrato.modalidad.aplica_credito and contrato.plan_cuotas.count() > 0:
                pendientes = contrato.plan_cuotas.filter(estado_cuota__in=['PENDIENTE', 'VENCIDA']).count()
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


# ==============================================================================
# 8. SERIALIZADOR PRINCIPAL DE CONTRATO
# ==============================================================================
class ContratoSerializer(serializers.ModelSerializer):
    usuario_asesor = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False
    )
    cliente_nombre = serializers.CharField(source='cliente.__str__', read_only=True)
    modalidad_nombre = serializers.CharField(source='modalidad.nombre_modalidad', read_only=True)
    estado_nombre = serializers.CharField(source='estado_contrato.nombre_estado_contrato', read_only=True)
    detalles_espacio = DetalleContratoEspacioSerializer(many=True, read_only=True)
    plan_cuotas = PlanPagoCuotaSerializer(many=True, read_only=True)
    control_mantenimientos = ControlMantenimientoSerializer(many=True, read_only=True)

    # Campos de entrada opcionales para asignación masiva de espacios o estructura
    espacios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Lista de IDs de espacios físicos (nichos) a asociar"
    )
    estructura_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID de estructura completa (Mausoleo/Capilla) para asociar todos sus nichos"
    )

    class Meta:
        model = Contrato
        fields = [
            'id_contrato',
            'numero_contrato',
            'cliente',
            'cliente_nombre',
            'usuario_asesor',
            'modalidad',
            'modalidad_nombre',
            'estado_contrato',
            'estado_nombre',
            'monto_total',
            'monto_enganche',
            'monto_financiar',
            'plazo_meses',
            'fecha_firma',
            'fecha_inicio_pago',
            'detalles_espacio',
            'plan_cuotas',
            'control_mantenimientos',
            'espacios_ids',
            'estructura_id'
        ]
        read_only_fields = ['id_contrato', 'monto_financiar']

    @transaction.atomic
    def create(self, validated_data):
        espacios_ids = validated_data.pop('espacios_ids', [])
        estructura_id = validated_data.pop('estructura_id', None)

        request = self.context.get('request')
        if 'usuario_asesor' not in validated_data and request and request.user and not request.user.is_anonymous:
            validated_data['usuario_asesor'] = request.user

        # Crear contrato maestro
        contrato = Contrato.objects.create(**validated_data)

        # Obtener o asignar estado 'Reservado' para los inmuebles vendidos
        estado_reservado, _ = EstadoEspacio.objects.get_or_create(nombre_estado='Reservado')

        # Asignar espacios físicos (Regla 1: Normalización en tabla intermedia)
        espacios_a_vincular = []
        if estructura_id:
            # Caso Mausoleo o Capilla completa: todos los nichos de la estructura
            espacios_a_vincular = list(EspacioFisico.objects.filter(estructura_id=estructura_id))
        elif espacios_ids:
            espacios_a_vincular = list(EspacioFisico.objects.filter(id_espacio__in=espacios_ids))

        total_espacios = len(espacios_a_vincular)
        precio_unitario = (contrato.monto_total / total_espacios) if total_espacios > 0 else 0

        for esp in espacios_a_vincular:
            DetalleContratoEspacio.objects.create(
                contrato=contrato,
                espacio=esp,
                precio_venta_unitario=precio_unitario
            )
            # Cambiar estado comercial del nicho a Reservado
            esp.estado = estado_reservado
            esp.save()

        # Generar tabla de amortización si aplica crédito (RF-01)
        if contrato.modalidad.aplica_credito:
            contrato.generar_plan_amortizacion()

        # Generar primer cobro anual de mantenimiento para el año en curso (RF-06)
        anio_actual = date.today().year
        ControlMantenimiento.objects.get_or_create(
            contrato=contrato,
            anio_periodo=anio_actual,
            defaults={
                'monto_mantenimiento': 500.00,  # Tarifa base anual estándar en Quetzales
                'fecha_limite_pago': date(anio_actual, 12, 31),
                'estado_cobro': 'PENDIENTE'
            }
        )

        # Registro en Bitácora de auditoría
        Bitacora.objects.create(
            usuario=contrato.usuario_asesor,
            tabla_afectada='comercial_contrato',
            accion='INSERT',
            registro_id=contrato.id_contrato,
            datos_nuevos={
                'numero_contrato': contrato.numero_contrato,
                'cliente': contrato.cliente.nombres,
                'monto_total': str(contrato.monto_total),
                'plazo_meses': contrato.plazo_meses
            }
        )

        return contrato


# ==============================================================================
# 9. SERIALIZADOR SIMULADOR DE COTIZACIÓN COMERCIAL (RF-01)
# ==============================================================================
class CotizacionSimuladorSerializer(serializers.Serializer):
    monto_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        help_text="Monto total del inmueble o paquete comercial (Q)"
    )
    monto_enganche = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        help_text="Monto de enganche propuesto (Q)"
    )
    plazo_meses = serializers.IntegerField(
        min_value=1,
        max_value=120,
        help_text="Plazo en meses (12 a 60 meses)"
    )
    cliente_nombre = serializers.CharField(
        required=False,
        default="Cliente Prospección",
        help_text="Nombre del prospecto de cliente"
    )
    exportar_pdf = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Si es true, la respuesta será un archivo PDF descargable"
    )

    def validate(self, attrs):
        if attrs['monto_enganche'] > attrs['monto_total']:
            raise serializers.ValidationError({
                'monto_enganche': 'El enganche no puede ser mayor al monto total.'
            })
        return attrs

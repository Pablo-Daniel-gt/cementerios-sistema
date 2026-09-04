"""
SERIALIZADORES DE CONTRATOS Y DETALLES DE ESPACIO (apps/comercial/serializers/contrato.py)

Define los serializadores principales para la suscripción de contratos comerciales:
- DetalleContratoEspacioSerializer
- ContratoSerializer (Formalización, asignación de nichos/estructuras, tabla de amortización y cobranza inicial)
"""

from rest_framework import serializers
from django.db import transaction
from datetime import date
from decimal import Decimal

from ..models import (
    Contrato,
    DetalleContratoEspacio,
    EstadoContrato,
    ControlMantenimiento,
    ReciboPago,
    DetallePagoRecibo
)
from .amortizacion import PlanPagoCuotaSerializer, ControlMantenimientoSerializer
from apps.cuentas.models import Usuario, Bitacora
from apps.inventario.models import EspacioFisico, EstadoEspacio


class DetalleContratoEspacioSerializer(serializers.ModelSerializer):
    """
    Serializador para la tabla intermedia de asignación de espacios físicos (nichos) a contratos.
    """
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


class ContratoSerializer(serializers.ModelSerializer):
    """
    Serializador Principal de Contratos Comerciales.
    Maneja la suscripción de ventas, asignación de nichos o estructuras completas,
    generación automática del plan de amortización (RF-01) y cobros iniciales.
    """
    usuario_asesor = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False
    )
    cliente_nombre = serializers.CharField(source='cliente.__str__', read_only=True)
    modalidad_nombre = serializers.CharField(source='modalidad.nombre_modalidad', read_only=True)
    estado_nombre = serializers.CharField(source='estado_contrato.nombre_estado_contrato', read_only=True)
    enganche_pagado = serializers.SerializerMethodField()
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

    # Campos de entrada opcionales para cobro inmediato de Enganche al formalizar
    pago_enganche_inmediato = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Indica si el monto de enganche fue cancelado en el acto al suscribir el contrato"
    )
    metodo_pago_enganche = serializers.CharField(
        write_only=True,
        required=False,
        default='EFECTIVO',
        help_text="Método de pago del enganche inicial (EFECTIVO, DEPOSITO_BANCO, TRANSFERENCIA, TARJETA)"
    )
    boleta_enganche = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
        help_text="Número de boleta o transferencia del pago de enganche"
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
            'enganche_pagado',
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
            'estructura_id',
            'pago_enganche_inmediato',
            'metodo_pago_enganche',
            'boleta_enganche'
        ]
        read_only_fields = ['id_contrato', 'monto_financiar']

    def get_enganche_pagado(self, obj):
        return DetallePagoRecibo.objects.filter(recibo__contrato=obj, concepto='ENGANCHE').exists()

    def validate_estado_contrato(self, value):
        # Regla a: Al crear un contrato no se puede seleccionar el estado "Cancelado"
        if self.instance is None and value and value.nombre_estado_contrato.lower() == 'cancelado':
            raise serializers.ValidationError("No se puede crear un contrato directamente con el estado 'Cancelado'.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        espacios_ids = validated_data.pop('espacios_ids', [])
        estructura_id = validated_data.pop('estructura_id', None)
        pago_enganche_inmediato = validated_data.pop('pago_enganche_inmediato', False)
        metodo_pago_enganche = validated_data.pop('metodo_pago_enganche', 'EFECTIVO')
        boleta_enganche = validated_data.pop('boleta_enganche', None)

        request = self.context.get('request')
        if 'usuario_asesor' not in validated_data and request and request.user and not request.user.is_anonymous:
            validated_data['usuario_asesor'] = request.user

        # Regla b: Ajustar estado inicial según pago de enganche
        estado_solicitado = EstadoContrato.objects.filter(nombre_estado_contrato='Solicitado').first()
        estado_activo = EstadoContrato.objects.filter(nombre_estado_contrato='Activo').first()

        monto_eng = Decimal(str(validated_data.get('monto_enganche', 0)))

        if pago_enganche_inmediato and monto_eng > Decimal('0.00'):
            if estado_activo:
                validated_data['estado_contrato'] = estado_activo
        else:
            if 'estado_contrato' not in validated_data or not validated_data['estado_contrato'] or validated_data['estado_contrato'].nombre_estado_contrato == 'Activo':
                if (monto_eng == Decimal('0.00') or not pago_enganche_inmediato) and estado_solicitado:
                    validated_data['estado_contrato'] = estado_solicitado

        # Crear contrato maestro
        contrato = Contrato.objects.create(**validated_data)

        # Si se marcó que el enganche fue pagado inmediatamente al crear el contrato
        if pago_enganche_inmediato and contrato.monto_enganche > Decimal('0.00'):
            recibo = ReciboPago.objects.create(
                contrato=contrato,
                usuario_cajero=contrato.usuario_asesor,
                monto_ingresado=contrato.monto_enganche,
                metodo_pago=metodo_pago_enganche,
                numero_boleta_banco=boleta_enganche,
                observaciones="Cobro automático de Enganche Inicial al suscribir el contrato."
            )
            DetallePagoRecibo.objects.create(
                recibo=recibo,
                concepto='ENGANCHE',
                monto_aplicado=contrato.monto_enganche
            )

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

        # Regla c: Evaluar auto-liquidación de contrato para modalidad contado con enganche cancelado
        estado_liquidado = EstadoContrato.objects.filter(nombre_estado_contrato='Liquidado').first()
        if estado_liquidado:
            if not contrato.modalidad.aplica_credito and pago_enganche_inmediato:
                contrato.estado_contrato = estado_liquidado
                contrato.save(update_fields=['estado_contrato'])

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

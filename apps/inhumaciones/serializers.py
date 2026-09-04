"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - SERIALIZADORES DRF (apps/inhumaciones/serializers.py)

Define los serializadores para la API REST DRF:
- DifuntoSerializer: Registro y consulta biográfica de difuntos.
- RegistroInhumacionSerializer: Manejo del evento de sepelio, anexos digitales (RENAP/MSPAS),
  validaciones comerciales de solvencia contractual (RF-05) y control de concurrencia de espacios (RNF-02).
"""

from rest_framework import serializers
from django.db import transaction
from django.conf import settings
from .models import Difunto, RegistroInhumacion
from apps.comercial.models import Contrato, DetalleContratoEspacio
from apps.inventario.models import EspacioFisico, EstadoEspacio
from apps.cuentas.models import Usuario, Bitacora


# ==============================================================================
# 1. SERIALIZADOR DIFUNTO
# ==============================================================================
class DifuntoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    tiene_inhumacion = serializers.SerializerMethodField()

    class Meta:
        model = Difunto
        fields = [
            'id',
            'cui',
            'nombres',
            'apellidos',
            'nombre_completo',
            'fecha_nacimiento',
            'fecha_defuncion',
            'causa_muerte',
            'lugar_defuncion',
            'tiene_inhumacion',
        ]
        read_only_fields = ['id']

    def get_nombre_completo(self, obj):
        return f"{obj.nombres} {obj.apellidos}"

    def get_tiene_inhumacion(self, obj):
        return hasattr(obj, 'registro_inhumacion') and obj.registro_inhumacion is not None

    def validate_cui(self, value):
        if value:
            value = value.strip()
            if len(value) != 13 or not value.isdigit():
                raise serializers.ValidationError("El CUI debe contener exactamente 13 dígitos numéricos.")
        return value

    def validate(self, attrs):
        fecha_nac = attrs.get('fecha_nacimiento')
        fecha_def = attrs.get('fecha_defuncion')

        if fecha_nac and fecha_def and fecha_nac > fecha_def:
            raise serializers.ValidationError({
                'fecha_nacimiento': "La fecha de nacimiento no puede ser posterior a la fecha de defunción."
            })
        return attrs


# ==============================================================================
# 2. SERIALIZADOR REGISTRO INHUMACIÓN
# ==============================================================================
class RegistroInhumacionSerializer(serializers.ModelSerializer):
    usuario_registro = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        required=False,
        allow_null=True
    )
    difunto_detalle = DifuntoSerializer(source='difunto', read_only=True)
    espacio_codigo = serializers.CharField(source='espacio.codigo_unico_espacio', read_only=True)
    sector_nombre = serializers.CharField(source='espacio.estructura.sector.nombre_sector', read_only=True)
    estructura_nombre = serializers.CharField(source='espacio.estructura.nombre_estructura', read_only=True)
    contrato_numero = serializers.CharField(source='contrato.numero_contrato', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    usuario_registro_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RegistroInhumacion
        fields = [
            'id',
            'difunto',
            'difunto_detalle',
            'espacio',
            'espacio_codigo',
            'sector_nombre',
            'estructura_nombre',
            'contrato',
            'contrato_numero',
            'cliente_nombre',
            'usuario_registro',
            'usuario_registro_nombre',
            'fecha_sepelio',
            'acta_renap_pdf',
            'certificado_mspas_pdf',
            'observaciones',
            'estado_inhumacion',
        ]
        read_only_fields = ['id']

    def get_cliente_nombre(self, obj):
        if obj.contrato and obj.contrato.cliente:
            return f"{obj.contrato.cliente.nombres} {obj.contrato.cliente.apellidos} (CUI: {obj.contrato.cliente.cui})"
        return ""

    def get_usuario_registro_nombre(self, obj):
        if obj.usuario_registro:
            return obj.usuario_registro.get_full_name() or obj.usuario_registro.username
        return ""

    def validate(self, attrs):
        espacio = attrs.get('espacio') or (self.instance.espacio if self.instance else None)
        contrato = attrs.get('contrato') or (self.instance.contrato if self.instance else None)
        estado_inhumacion = attrs.get('estado_inhumacion', self.instance.estado_inhumacion if self.instance else 'ACTIVA')

        # ----------------------------------------------------------------------
        # REGLA COMERCIAL DE SOLVENCIA (RF-05)
        # ----------------------------------------------------------------------
        if contrato:
            # 1. Estado del contrato debe ser 'Activo' o 'Liquidado'
            nombre_estado = contrato.estado_contrato.nombre_estado_contrato
            if nombre_estado not in ['Activo', 'Liquidado']:
                raise serializers.ValidationError({
                    'contrato': f"El contrato '{contrato.numero_contrato}' no está habilitado para sepelios (Estado actual: '{nombre_estado}'). Debe estar en estado 'Activo' o 'Liquidado'."
                })

            # 2. El espacio debe ser propiedad de este contrato
            if espacio:
                es_propiedad = DetalleContratoEspacio.objects.filter(
                    contrato=contrato,
                    espacio=espacio
                ).exists()

                if not es_propiedad:
                    raise serializers.ValidationError({
                        'espacio': f"El espacio físico '{espacio.codigo_unico_espacio}' no pertenece a la propiedad titular del contrato '{contrato.numero_contrato}'."
                    })

            # 3. Comprobar mora imprevista en cuotas o mantenimientos (RF-05)
            tiene_mantenimiento_mora = contrato.control_mantenimientos.filter(estado_cobro='EN_MORA').exists()
            tiene_cuota_vencida = contrato.plan_cuotas.filter(estado_cuota='VENCIDA').exists()

            if tiene_mantenimiento_mora or tiene_cuota_vencida:
                raise serializers.ValidationError({
                    'contrato': f"El contrato '{contrato.numero_contrato}' presenta saldos o cuotas en MORA. Se requiere regularizar el pago en caja antes de autorizar la inhumación."
                })

        # ----------------------------------------------------------------------
        # REGLA DE CAPACIDAD Y CONTROL DE CONCURRENCIA (RNF-02)
        # ----------------------------------------------------------------------
        if espacio and estado_inhumacion == 'ACTIVA':
            # Verificar si ya existe una inhumación ACTIVA en este espacio
            inhumaciones_activas = RegistroInhumacion.objects.filter(
                espacio=espacio,
                estado_inhumacion='ACTIVA'
            )
            if self.instance:
                inhumaciones_activas = inhumaciones_activas.exclude(pk=self.instance.pk)

            if inhumaciones_activas.exists():
                inhum_existente = inhumaciones_activas.first()
                raise serializers.ValidationError({
                    'espacio': f"El espacio físico '{espacio.codigo_unico_espacio}' ya se encuentra ocupado por la inhumación activa #{inhum_existente.id} ({inhum_existente.difunto.nombres} {inhum_existente.difunto.apellidos})."
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')

        # Asignar usuario ejecutor si no fue provisto
        if 'usuario_registro' not in validated_data and request and request.user and not request.user.is_anonymous:
            validated_data['usuario_registro'] = request.user

        # 1. Crear el registro de inhumación
        registro = RegistroInhumacion.objects.create(**validated_data)

        # 2. Si el estado es 'ACTIVA', actualizar el estado del espacio físico a 'Ocupado'
        if registro.estado_inhumacion == 'ACTIVA':
            estado_ocupado, _ = EstadoEspacio.objects.get_or_create(nombre_estado='Ocupado')
            espacio = registro.espacio
            espacio.estado = estado_ocupado
            espacio.save(update_fields=['estado'])

        # 3. Registrar en Bitácora de auditoría (RNF-08)
        Bitacora.objects.create(
            usuario=registro.usuario_registro,
            tabla_afectada='inhumaciones_registro',
            accion='INSERT',
            registro_id=registro.id,
            datos_nuevos={
                'difunto_id': registro.difunto.id,
                'difunto_nombre': f"{registro.difunto.nombres} {registro.difunto.apellidos}",
                'espacio': registro.espacio.codigo_unico_espacio,
                'contrato': registro.contrato.numero_contrato,
                'fecha_sepelio': registro.fecha_sepelio.isoformat(),
                'estado_inhumacion': registro.estado_inhumacion
            }
        )

        return registro

    @transaction.atomic
    def update(self, instance, validated_data):
        estado_anterior = instance.estado_inhumacion
        espacio_anterior = instance.espacio

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si el estado cambió de ACTIVA a EXHUMADO o TRASLADADO, pasar el espacio físico a 'Reservado' (mantiene titularidad por contrato)
        if estado_anterior == 'ACTIVA' and instance.estado_inhumacion in ['EXHUMADO', 'TRASLADADO']:
            # Comprobar si no quedan otras inhumaciones activas en ese espacio
            quedan_activas = RegistroInhumacion.objects.filter(espacio=espacio_anterior, estado_inhumacion='ACTIVA').exists()
            if not quedan_activas:
                estado_reservado, _ = EstadoEspacio.objects.get_or_create(nombre_estado='Reservado')
                espacio_anterior.estado = estado_reservado
                espacio_anterior.save(update_fields=['estado'])

        # Bitácora de actualización
        request = self.context.get('request')
        usuario = request.user if (request and request.user and not request.user.is_anonymous) else instance.usuario_registro
        Bitacora.objects.create(
            usuario=usuario,
            tabla_afectada='inhumaciones_registro',
            accion='UPDATE',
            registro_id=instance.id,
            datos_anteriores={'estado_inhumacion': estado_anterior},
            datos_nuevos={'estado_inhumacion': instance.estado_inhumacion}
        )

        return instance

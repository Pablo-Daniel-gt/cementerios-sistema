"""
MÓDULO DE INVENTARIO - SERIALIZADORES (apps/inventario/serializers.py)

Este archivo define los serializadores de Django REST Framework (DRF) para los modelos
del Módulo B: Sector, TipoEstructura, EstadoEspacio, EstructuraFisica y EspacioFisico,
así como el serializador especializado para la Matriz Visual 2D (RF-02).
"""

from rest_framework import serializers
from .models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico


from decimal import Decimal


# ==============================================================================
# 1. SERIALIZADOR DE SECTOR
# ==============================================================================
class SectorSerializer(serializers.ModelSerializer):
    """
    Serializador para la entidad Sector.
    """
    class Meta:
        model = Sector
        fields = '__all__'


# ==============================================================================
# 2. SERIALIZADOR DE TIPO DE ESTRUCTURA
# ==============================================================================
class TipoEstructuraSerializer(serializers.ModelSerializer):
    """
    Serializador para la entidad TipoEstructura.
    """
    class Meta:
        model = TipoEstructura
        fields = '__all__'


# ==============================================================================
# 3. SERIALIZADOR DE ESTADO DE ESPACIO
# ==============================================================================
class EstadoEspacioSerializer(serializers.ModelSerializer):
    """
    Serializador para la entidad EstadoEspacio.
    """
    class Meta:
        model = EstadoEspacio
        fields = '__all__'


# ==============================================================================
# 4. SERIALIZADOR DE ESPACIO FÍSICO
# ==============================================================================
class EspacioFisicoSerializer(serializers.ModelSerializer):
    """
    Serializador estándar CRUD para la entidad EspacioFisico.
    Incluye campos de lectura rápida para nombres de estado y estructura.
    """
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre_estado')
    estructura_nombre = serializers.ReadOnlyField(source='estructura.nombre_estructura')
    en_contrato = serializers.SerializerMethodField()

    posicion_fila = serializers.IntegerField(required=False, min_value=1)
    posicion_columna = serializers.IntegerField(required=False, min_value=1)
    estructura = serializers.PrimaryKeyRelatedField(queryset=EstructuraFisica.objects.all(), required=False)
    estado = serializers.PrimaryKeyRelatedField(queryset=EstadoEspacio.objects.all(), required=False)

    class Meta:
        model = EspacioFisico
        fields = '__all__'
        validators = []

    def get_en_contrato(self, obj):
        return hasattr(obj, 'detalle_contrato') and obj.detalle_contrato is not None

    def to_internal_value(self, data):
        data = data.copy()
        if 'estado' in data:
            val = data['estado']
            if isinstance(val, str) and not val.isdigit():
                try:
                    obj = EstadoEspacio.objects.get(nombre_estado=val)
                    data['estado'] = obj.pk
                except Exception:
                    data.pop('estado', None)
        if 'estructura' in data:
            val = data['estructura']
            if isinstance(val, str) and not val.isdigit():
                data.pop('estructura', None)
        return super().to_internal_value(data)

    def validate(self, attrs):
        if self.instance:
            # Regla 1a: Bloqueo de cambio manual de estado si el nicho se encuentra Ocupado
            nuevo_estado = attrs.get('estado')
            if nuevo_estado and self.instance.estado and self.instance.estado.nombre_estado == 'Ocupado' and nuevo_estado != self.instance.estado:
                raise serializers.ValidationError({
                    'estado': "No se puede modificar manualmente el estado de un nicho 'Ocupado'. El cambio de estado debe realizarse a través del proceso de Exhumación o Traslado en el Módulo de Inhumaciones."
                })

            # Regla 1b: Bloqueo de modificación de precio si el nicho se encuentra asignado a un contrato comercial
            nuevo_precio = attrs.get('precio_individual')
            if nuevo_precio is not None and hasattr(self.instance, 'detalle_contrato') and self.instance.detalle_contrato is not None:
                if Decimal(str(nuevo_precio)) != Decimal(str(self.instance.precio_individual or 0)):
                    raise serializers.ValidationError({
                        'precio_individual': "El precio individual de este nicho no se puede modificar porque se encuentra asignado a un contrato comercial."
                    })

        estructura = attrs.get('estructura') or (self.instance.estructura if self.instance else None)
        posicion_fila = attrs.get('posicion_fila') if 'posicion_fila' in attrs else (self.instance.posicion_fila if self.instance else None)
        posicion_columna = attrs.get('posicion_columna') if 'posicion_columna' in attrs else (self.instance.posicion_columna if self.instance else None)

        if estructura and posicion_fila is not None and posicion_columna is not None:
            if posicion_fila > estructura.total_filas:
                raise serializers.ValidationError({
                    'posicion_fila': f'La fila ({posicion_fila}) excede el límite máximo de filas de la estructura ({estructura.total_filas}).'
                })
            if posicion_columna > estructura.total_columnas:
                raise serializers.ValidationError({
                    'posicion_columna': f'La columna ({posicion_columna}) excede el límite máximo de columnas de la estructura ({estructura.total_columnas}).'
                })

            # Validar existencia de nicho en misma posición dentro de la estructura
            query = EspacioFisico.objects.filter(
                estructura=estructura,
                posicion_fila=posicion_fila,
                posicion_columna=posicion_columna
            )
            if self.instance:
                query = query.exclude(pk=self.instance.pk)

            if query.exists():
                raise serializers.ValidationError(
                    f"No es posible registrar o mover el nicho a esta posición (Fila {posicion_fila} - Columna {posicion_columna}). Por favor asigne el espacio correspondiente."
                )

        return attrs


# ==============================================================================
# 5. SERIALIZADOR DE ESTRUCTURA FÍSICA
# ==============================================================================
class EstructuraFisicaSerializer(serializers.ModelSerializer):
    """
    Serializador estándar CRUD para la entidad EstructuraFisica.
    Incluye campos informativos de solo lectura para Sector y TipoEstructura.
    """
    sector_nombre = serializers.ReadOnlyField(source='sector.nombre_sector')
    tipo_estructura_nombre = serializers.ReadOnlyField(source='tipo_estructura.nombre_tipo')
    disponible_completa = serializers.SerializerMethodField()
    total_espacios_creados = serializers.SerializerMethodField()

    class Meta:
        model = EstructuraFisica
        fields = '__all__'

    def get_disponible_completa(self, obj):
        total = obj.espacios.count()
        if total == 0:
            return False
        disponibles = obj.espacios.filter(estado__nombre_estado='Disponible', detalle_contrato__isnull=True).count()
        return disponibles == total

    def get_total_espacios_creados(self, obj):
        return obj.espacios.count()



# ==============================================================================
# 6. SERIALIZADORES ESPECIALIZADOS PARA LA MATRIZ VISUAL 2D (RF-02)
# ==============================================================================
class EspacioMatrizItemSerializer(serializers.ModelSerializer):
    """
    Serializador para cada nicho/espacio individual dentro del arreglo `matriz_espacios`.
    """
    estado = serializers.CharField(source='estado.nombre_estado', read_only=True)

    class Meta:
        model = EspacioFisico
        fields = (
            'id_espacio',
            'codigo_unico_espacio',
            'posicion_fila',
            'posicion_columna',
            'estado',
            'precio_individual',
            'dimensiones',
            'material_construccion',
        )


class EstructuraMatrizSerializer(serializers.ModelSerializer):
    """
    Serializador especializado para el endpoint GET /api/v1/inventario/estructuras/{id}/matriz/
    Retorna la estructura y el arreglo anidado de espacios físicos 2D para renderizar la grilla.
    """
    sector = serializers.CharField(source='sector.nombre_sector', read_only=True)
    nomenclatura_sector = serializers.CharField(source='sector.nomenclatura', read_only=True)
    matriz_espacios = EspacioMatrizItemSerializer(source='espacios', many=True, read_only=True)

    class Meta:
        model = EstructuraFisica
        fields = (
            'id_estructura',
            'nombre_estructura',
            'codigo_estructura',
            'sector',
            'nomenclatura_sector',
            'total_filas',
            'total_columnas',
            'capacidad_total_espacios',
            'precio_estructura_completa',
            'matriz_espacios',
        )

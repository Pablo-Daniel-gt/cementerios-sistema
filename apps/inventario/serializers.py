"""
MÓDULO DE INVENTARIO - SERIALIZADORES (apps/inventario/serializers.py)

Este archivo define los serializadores de Django REST Framework (DRF) para los modelos
del Módulo B: Sector, TipoEstructura, EstadoEspacio, EstructuraFisica y EspacioFisico,
así como el serializador especializado para la Matriz Visual 2D (RF-02).
"""

from rest_framework import serializers
from .models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico


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

    class Meta:
        model = EspacioFisico
        fields = '__all__'


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

    class Meta:
        model = EstructuraFisica
        fields = '__all__'


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

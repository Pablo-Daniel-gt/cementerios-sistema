"""
SERIALIZADORES DE CATÁLOGOS AUXILIARES (apps/comercial/serializers/catalogos.py)

Define los serializadores para las tablas de catálogo comercial:
- ModalidadVentaSerializer
- EstadoContratoSerializer
"""

from rest_framework import serializers
from ..models import ModalidadVenta, EstadoContrato


class ModalidadVentaSerializer(serializers.ModelSerializer):
    """
    Serializador para las modalidades de venta (Contado, Créditos 12 a 60 Meses).
    """
    class Meta:
        model = ModalidadVenta
        fields = '__all__'


class EstadoContratoSerializer(serializers.ModelSerializer):
    """
    Serializador para los estados de contrato (Solicitado, Activo, Liquidado, Cancelado).
    """
    class Meta:
        model = EstadoContrato
        fields = '__all__'

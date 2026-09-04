"""
SERIALIZADORES DE PLAN DE AMORTIZACIÓN Y MANTENIMIENTO (apps/comercial/serializers/amortizacion.py)

Define los serializadores para la consulta de planes de pago y mantenimientos anuales:
- PlanPagoCuotaSerializer
- ControlMantenimientoSerializer
"""

from rest_framework import serializers
from ..models import PlanPagoCuota, ControlMantenimiento


class PlanPagoCuotaSerializer(serializers.ModelSerializer):
    """
    Serializador para las cuotas del plan de amortización a crédito.
    """
    class Meta:
        model = PlanPagoCuota
        fields = '__all__'
        read_only_fields = ['id_plan']


class ControlMantenimientoSerializer(serializers.ModelSerializer):
    """
    Serializador para las cuotas anuales de mantenimiento del camposanto.
    """
    class Meta:
        model = ControlMantenimiento
        fields = '__all__'
        read_only_fields = ['id_control_mante']

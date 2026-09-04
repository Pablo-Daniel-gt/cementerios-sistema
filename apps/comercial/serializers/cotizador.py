"""
SERIALIZADOR SIMULADOR DE COTIZACIÓN COMERCIAL (apps/comercial/serializers/cotizador.py)

Define el serializador de validación para la calculadora/simulador financiero (RF-01):
- CotizacionSimuladorSerializer
"""

from rest_framework import serializers


class CotizacionSimuladorSerializer(serializers.Serializer):
    """
    Serializador para el Cotizador Financiero Automático (RF-01).
    Calcula montos a financiar, cuotas mensuales proyectadas y exportación a PDF.
    """
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

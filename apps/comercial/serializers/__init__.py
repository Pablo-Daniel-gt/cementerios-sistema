"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - PAQUETE DE SERIALIZADORES DRF (apps/comercial/serializers/)

Este paquete modulariza los serializadores del Módulo Comercial por sub-dominios de negocio:
- catalogos: ModalidadVentaSerializer, EstadoContratoSerializer
- amortizacion: PlanPagoCuotaSerializer, ControlMantenimientoSerializer
- caja: DetallePagoReciboSerializer, ReciboPagoSerializer
- contrato: DetalleContratoEspacioSerializer, ContratoSerializer
- cotizador: CotizacionSimuladorSerializer
"""

from .catalogos import (
    ModalidadVentaSerializer,
    EstadoContratoSerializer,
)
from .amortizacion import (
    PlanPagoCuotaSerializer,
    ControlMantenimientoSerializer,
)
from .caja import (
    DetallePagoReciboSerializer,
    ReciboPagoSerializer,
)
from .contrato import (
    DetalleContratoEspacioSerializer,
    ContratoSerializer,
)
from .cotizador import (
    CotizacionSimuladorSerializer,
)

__all__ = [
    'ModalidadVentaSerializer',
    'EstadoContratoSerializer',
    'PlanPagoCuotaSerializer',
    'ControlMantenimientoSerializer',
    'DetallePagoReciboSerializer',
    'ReciboPagoSerializer',
    'DetalleContratoEspacioSerializer',
    'ContratoSerializer',
    'CotizacionSimuladorSerializer',
]

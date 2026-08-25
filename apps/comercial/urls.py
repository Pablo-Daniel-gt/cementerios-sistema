"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - RUTAS URL (apps/comercial/urls.py)

Centraliza el enrutamiento de la API REST para el Módulo C:
- Endpoints CRUD de Modalidades, Estados, Contratos, Cuotas, Mantenimientos y Recibos
- Endpoint /cotizar/ (Simulador financiero y PDF RF-01)
- Endpoint /alertas-mora/ (Tablero de cobranza RF-06)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ModalidadVentaViewSet,
    EstadoContratoViewSet,
    ContratoViewSet,
    PlanPagoCuotaViewSet,
    ControlMantenimientoViewSet,
    ReciboPagoViewSet,
    CotizadorView,
    AlertasMoraView
)

router = DefaultRouter()
router.register(r'modalidades', ModalidadVentaViewSet, basename='modalidad-venta')
router.register(r'estados-contrato', EstadoContratoViewSet, basename='estado-contrato')
router.register(r'contratos', ContratoViewSet, basename='contrato')
router.register(r'plan-cuotas', PlanPagoCuotaViewSet, basename='plan-pago-cuota')
router.register(r'control-mantenimiento', ControlMantenimientoViewSet, basename='control-mantenimiento')
router.register(r'recibos', ReciboPagoViewSet, basename='recibo-pago')

urlpatterns = [
    # Endpoints especializados de lógica de negocio
    path('cotizar/', CotizadorView.as_view(), name='cotizador-simulador'),
    path('alertas-mora/', AlertasMoraView.as_view(), name='alertas-mora'),

    # Endpoints CRUD del Router DRF
    path('', include(router.urls)),
]

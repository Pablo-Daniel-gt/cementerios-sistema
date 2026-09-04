"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - RUTAS URL (apps/inhumaciones/urls.py)

Centraliza el enrutamiento de la API REST para el Módulo D:
- GET/POST /api/v1/inhumaciones/difuntos/
- GET/POST /api/v1/inhumaciones/registros/
- POST /api/v1/inhumaciones/registros/{id}/exhumar/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DifuntoViewSet, RegistroInhumacionViewSet

router = DefaultRouter()
router.register(r'difuntos', DifuntoViewSet, basename='difunto')
router.register(r'registros', RegistroInhumacionViewSet, basename='registro-inhumacion')

urlpatterns = [
    path('', include(router.urls)),
]

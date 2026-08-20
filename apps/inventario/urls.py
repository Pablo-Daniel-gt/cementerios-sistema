"""
MÓDULO DE INVENTARIO - RUTAS INTERNAS DE LA APLICACIÓN (apps/inventario/urls.py)

Este archivo configura las URL locales para la aplicación `inventario` utilizando el `DefaultRouter`
de Django REST Framework.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SectorViewSet,
    TipoEstructuraViewSet,
    EstadoEspacioViewSet,
    EstructuraFisicaViewSet,
    EspacioFisicoViewSet
)

# Router predeterminado de DRF
router = DefaultRouter()

# Registro de ViewSets y prefijos de URL
router.register(r'sectores', SectorViewSet, basename='sector')
router.register(r'tipos-estructura', TipoEstructuraViewSet, basename='tipo-estructura')
router.register(r'estados-espacio', EstadoEspacioViewSet, basename='estado-espacio')
router.register(r'estructuras', EstructuraFisicaViewSet, basename='estructura')
router.register(r'espacios', EspacioFisicoViewSet, basename='espacio')

urlpatterns = [
    path('', include(router.urls)),
]

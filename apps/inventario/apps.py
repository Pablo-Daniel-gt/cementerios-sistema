"""
CONFIGURACIÓN DE LA APLICACIÓN INVENTARIO

Este archivo define la configuración principal de la aplicación Django 'inventario'.
"""

from django.apps import AppConfig


class InventarioConfig(AppConfig):
    """
    Configuración de la app inventario.
    - default_auto_field: Define BigAutoField como tipo por defecto para claves primarias autogeneradas.
    - name: Indica la ruta completa del paquete ('apps.inventario') dentro del proyecto.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.inventario'
    verbose_name = 'Módulo de Inventario y Camposanto'


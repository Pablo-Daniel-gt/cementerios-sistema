"""
CONFIGURACIÓN DE LA APLICACIÓN CUENTAS

Este archivo define la configuración principal de la aplicación Django 'cuentas'.
"""

from django.apps import AppConfig


class CuentasConfig(AppConfig):
    """
    Configuración de la app cuentas.
    - default_auto_field: Define BigAutoField como tipo por defecto para claves primarias autogeneradas.
    - name: Indica la ruta completa del paquete ('apps.cuentas') dentro del proyecto.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.cuentas'
    verbose_name = 'Módulo de Cuentas y Auditoría'

    def ready(self):
        import apps.cuentas.signals  # noqa: F401


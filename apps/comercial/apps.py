"""
MÓDULO C - CONFIGURACIÓN DE LA APLICACIÓN COMERCIAL (apps/comercial/apps.py)
"""

from django.apps import AppConfig


class ComercialConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.comercial'
    verbose_name = 'Gestión Comercial y Financiera'

"""
MÓDULO D - CONFIGURACIÓN DE LA APLICACIÓN DE INHUMACIONES (apps/inhumaciones/apps.py)
"""

from django.apps import AppConfig


class InhumacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.inhumaciones'
    verbose_name = 'Registro Operativo de Inhumaciones y Exhumaciones'

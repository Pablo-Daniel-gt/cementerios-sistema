"""
CONFIGURACIÓN GLOBAL DE RUTAS DE URL (config/urls.py)

Este archivo centraliza el enrutamiento principal del sistema web del cementerio.
Redirige el tráfico HTTP entrante hacia el panel de administración (/admin/)
y hacia las APIs REST de los distintos módulos del sistema bajo la versión 1 (/api/v1/).
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Panel de Administración Nativo de Django
    path('admin/', admin.site.urls),

    # Módulo A: API REST de Cuentas (Roles, Usuarios, Clientes y Bitácora)
    path('api/v1/cuentas/', include('apps.cuentas.urls')),

    # Módulo B: API REST de Inventario (Sectores, Estructuras, Espacios Físicos / Matriz 2D)
    path('api/v1/inventario/', include('apps.inventario.urls')),

    # Módulo C: API REST Comercial y Financiera (Contratos, Cotizaciones, Caja y Alertas de Mora)
    path('api/v1/comercial/', include('apps.comercial.urls')),
]


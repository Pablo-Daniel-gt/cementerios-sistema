"""
MÓDULO DE CUENTAS - RUTAS INTERNAS DE LA APLICACIÓN (apps/cuentas/urls.py)

Este archivo configura las URL locales para la aplicación `cuentas` utilizando el `DefaultRouter`
de Django REST Framework.

¿Qué es `DefaultRouter`?
`DefaultRouter` genera automáticamente la tabla de enrutamiento HTTP mapeando los ViewSets a URLs de API REST estandarizadas:
- GET /roles/                  -> Listar roles
- POST /roles/                 -> Crear rol
- GET /roles/{id}/             -> Detalle del rol
- PUT /roles/{id}/             -> Actualizar rol completo
- PATCH /roles/{id}/           -> Actualizar rol parcialmente
- DELETE /roles/{id}/          -> Eliminar rol

De forma idéntica genera la estructura para usuarios, clientes y bitacora.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from .views import (
    RolViewSet,
    UsuarioViewSet,
    ClienteViewSet,
    BitacoraViewSet,
    LoginView,
    PerfilView,
    MiClienteView
)

# Instanciamos el router predeterminado de DRF
router = DefaultRouter()

# Registro de los ViewSets con sus correspondientes prefijos de URL y nombres base
# 1. Rutas para la gestión de Roles -> /roles/ y /roles/{id}/
router.register(r'roles', RolViewSet, basename='rol')

# 2. Rutas para la gestión de Usuarios -> /usuarios/ y /usuarios/{id}/
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

# 3. Rutas para la gestión de Clientes -> /clientes/ y /clientes/{id}/
router.register(r'clientes', ClienteViewSet, basename='cliente')

# 4. Rutas para la consulta de Bitácora de Auditoría -> /bitacora/ y /bitacora/{id}/
router.register(r'bitacora', BitacoraViewSet, basename='bitacora')

# Definición del patrón de URLs expuesto por esta aplicación
urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('me/', PerfilView.as_view(), name='perfil'),
    path('me/cliente/', MiClienteView.as_view(), name='mi-cliente'),
    # Incluye automáticamente todas las rutas generadas por el DefaultRouter
    path('', include(router.urls)),
    # Ruta base para el esquema de documentación de la API (OpenAPI/Swagger)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Ruta para la documentación interactiva de Swagger UI
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Ruta para la documentación interactiva de Redoc
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

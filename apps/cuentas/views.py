"""
MÓDULO DE CUENTAS - VISTAS DE LA API REST (apps/cuentas/views.py)

Este archivo define los `ModelViewSet` de Django REST Framework para los 4 modelos del Módulo A:
- RolViewSet
- UsuarioViewSet
- ClienteViewSet
- BitacoraViewSet

¿Qué es un `ModelViewSet` en Django REST Framework?
Un `ModelViewSet` es un conjunto de vistas basado en clases que proporciona automáticamente las 6
operaciones Estándar CRUD (Create, Read, Update, Delete) sobre un modelo de datos:
1. `list()` -> GET /api/v1/cuentas/<recurso>/ (Listar todos los registros)
2. `create()` -> POST /api/v1/cuentas/<recurso>/ (Crear un nuevo registro)
3. `retrieve()` -> GET /api/v1/cuentas/<recurso>/{id}/ (Obtener un registro específico por ID)
4. `update()` -> PUT /api/v1/cuentas/<recurso>/{id}/ (Actualizar un registro completo)
5. `partial_update()` -> PATCH /api/v1/cuentas/<recurso>/{id}/ (Actualizar campos específicos)
6. `destroy()` -> DELETE /api/v1/cuentas/<recurso>/{id}/ (Eliminar un registro)
"""

from rest_framework import viewsets
from .models import Rol, Usuario, Cliente, Bitacora
from .serializers import (
    RolSerializer,
    UsuarioSerializer,
    ClienteSerializer,
    BitacoraSerializer
)


# ==============================================================================
# 1. VIEWSET DE ROL
# ==============================================================================
class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las operaciones CRUD de la entidad Rol.
    
    Permite a los clientes de la API listar, consultar por ID, crear, actualizar
    y eliminar roles dentro del sistema de gestión.
    """
    # Consulta base para obtener todos los roles ordenados alfabéticamente por su nombre
    queryset = Rol.objects.all().order_by('nombre')
    
    # Asignación del serializador que transformará el modelo en JSON y viceversa
    serializer_class = RolSerializer


# ==============================================================================
# 2. VIEWSET DE USUARIO
# ==============================================================================
class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las operaciones CRUD del modelo personalizado Usuario.

    Proporciona endpoints para crear usuarios, asignar roles, actualizar información
    de contacto y gestionar el estado activo/inactivo del usuario.
    """
    # Consulta base para obtener todos los usuarios, optimizando el acceso al rol relacionado
    queryset = Usuario.objects.all().select_related('rol').order_by('id')
    
    # Serializador responsable de manejar la contraseña de forma segura (write_only)
    serializer_class = UsuarioSerializer


# ==============================================================================
# 3. VIEWSET DE CLIENTE
# ==============================================================================
class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las operaciones CRUD de los Clientes / Titulares del cementerio.

    Permite el registro de nuevos clientes, actualización de CUI, nombres, teléfono,
    dirección y vinculación opcional con un usuario de sistema.
    """
    # Consulta base para obtener todos los clientes
    queryset = Cliente.objects.all().select_related('usuario').order_by('id')
    
    # Serializador de datos para la entidad Cliente
    serializer_class = ClienteSerializer


# ==============================================================================
# 4. VIEWSET DE BITÁCORA DE AUDITORÍA
# ==============================================================================
class BitacoraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para consultar e interactuar con los registros de la Bitácora de Auditoría.

    Nota de diseño:
    Generalmente las bitácoras se consultan para auditar cambios. Este ViewSet expone
    la colección completa ordenada cronológicamente por la fecha más reciente.
    """
    # Consulta base ordenada de forma descendente por fecha y hora para mostrar auditoría reciente primero
    queryset = Bitacora.objects.all().select_related('usuario').order_by('-fecha_hora')
    
    # Serializador de datos para auditoría
    serializer_class = BitacoraSerializer

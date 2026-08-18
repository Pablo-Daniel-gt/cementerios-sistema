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


# ==============================================================================
# 5. VISTAS DE AUTENTICACIÓN (LOGIN Y PERFIL)
# ==============================================================================
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate


class LoginView(APIView):
    """
    Endpoint para autenticación de usuarios.
    POST /api/v1/cuentas/login/
    Body: { "username": "...", "password": "..." }
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Por favor proporcione usuario y contraseña'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if not user:
            return Response({'error': 'Credenciales inválidas. Verifique usuario y contraseña.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'La cuenta de usuario está desactivada'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)

        rol_nombre = user.rol.nombre if user.rol else None
        rol_id = user.rol.id if user.rol else None
        
        cliente_id = None
        if hasattr(user, 'cliente_perfil') and user.cliente_perfil:
            cliente_id = user.cliente_perfil.id

        Bitacora.objects.create(
            usuario=user,
            tabla_afectada='Usuario',
            accion='UPDATE',
            registro_id=user.id,
            datos_nuevos={'evento': 'Inicio de sesión exitoso'}
        )

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': rol_nombre,
                'rol_id': rol_id,
                'cliente_id': cliente_id,
                'is_staff': user.is_staff
            }
        })


class PerfilView(APIView):
    """
    Endpoint para obtener perfil de usuario autenticado.
    GET /api/v1/cuentas/me/
    """
    def get(self, request):
        user = request.user
        if not user or user.is_anonymous:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        
        rol_nombre = user.rol.nombre if user.rol else None
        cliente_id = user.cliente_perfil.id if hasattr(user, 'cliente_perfil') and user.cliente_perfil else None

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': rol_nombre,
                'rol_id': user.rol.id if user.rol else None,
                'cliente_id': cliente_id,
                'is_staff': user.is_staff
            }
        })


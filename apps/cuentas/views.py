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

from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
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
    """
    queryset = Rol.objects.all().order_by('nombre')
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==============================================================================
# 2. VIEWSET DE USUARIO
# ==============================================================================
class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las operaciones CRUD del modelo personalizado Usuario.
    """
    queryset = Usuario.objects.all().select_related('rol').order_by('id')
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==============================================================================
# 3. VIEWSET DE CLIENTE
# ==============================================================================
class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las operaciones CRUD de los Clientes / Titulares del cementerio.
    """
    queryset = Cliente.objects.all().select_related('usuario').order_by('id')
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==============================================================================
# 4. VIEWSET DE BITÁCORA DE AUDITORÍA
# ==============================================================================
class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Garantiza que la bitácora sea de sólo lectura (GET list / GET retrieve).
    """
    queryset = Bitacora.objects.all().select_related('usuario').order_by('-fecha_hora')
    serializer_class = BitacoraSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==============================================================================
# 5. VISTAS DE AUTENTICACIÓN (LOGIN, PERFIL Y MI CLIENTE)
# ==============================================================================
class LoginView(APIView):
    """
    Endpoint para autenticación de usuarios.
    POST /api/v1/cuentas/login/
    Body: { "username": "...", "password": "..." }
    """
    authentication_classes = []
    permission_classes = []
    throttle_classes = [AnonRateThrottle]

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
    permission_classes = [permissions.IsAuthenticated]

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


class MiClienteView(APIView):
    """
    Endpoint para obtener el perfil de Cliente del usuario autenticado (RF-03).
    GET /api/v1/cuentas/me/cliente/
    Retorna única y exclusivamente los datos del cliente asociado al usuario en sesión.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user or user.is_anonymous:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        cliente = None
        if hasattr(user, 'cliente_perfil') and user.cliente_perfil:
            cliente = user.cliente_perfil
        elif user.email:
            cliente = Cliente.objects.filter(correo__iexact=user.email).first()

        if not cliente:
            return Response(
                {'error': 'No se encontró un perfil de cliente titular asociado a este usuario.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ClienteSerializer(cliente)
        return Response(serializer.data, status=status.HTTP_200_OK)



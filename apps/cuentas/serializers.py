"""
MÓDULO DE CUENTAS - SERIALIZADORES (apps/cuentas/serializers.py)

Este archivo define los serializadores de Django REST Framework (DRF) para los 4 modelos
del Módulo A: Rol, Usuario, Cliente y Bitacora.

¿Qué es un Serializer en DRF?
Un serializador se encarga de:
1. Convertir instancias de modelos complejos de Django en tipos de datos nativos de Python (JSON)
   para enviarlos como respuestas HTTP (Serialización).
2. Validar los datos entrantes de las peticiones HTTP (POST, PUT, PATCH) y convertirlos
   en instancias de modelos para guardarlos en la base de datos (Deserialización).
"""

from rest_framework import serializers
from .models import Rol, Usuario, Cliente, Bitacora


# ==============================================================================
# 1. SERIALIZADOR DE ROL
# ==============================================================================
class RolSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Rol.
    Permite consultar, crear y actualizar los roles del sistema (ej. Administrador, Asesor, Cliente).
    """
    class Meta:
        model = Rol
        # Incluimos todos los campos de la tabla: id, nombre, descripcion
        fields = ['id', 'nombre', 'descripcion']


# ==============================================================================
# 2. SERIALIZADOR DE USUARIO
# ==============================================================================
class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo personalizado de Usuario (AbstractUser).

    Seguridad y Manejo de Contraseña:
    - El campo 'password' se configura como `write_only=True`. Esto garantiza que la contraseña
      (o su hash) NUNCA se devuelva en las respuestas JSON (GET, POST, etc.).
    - Se sobrescriben los métodos `create` y `update` para procesar la contraseña utilizando
      `set_password()`, lo que aplica el algoritmo de hashing seguro de Django (PBKDF2/Argon2)
      en lugar de guardar el texto plano en la base de datos.
    """
    # Campo de contraseña con escritura exclusiva (write_only). No se expondrá en respuestas GET.
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        help_text="Contraseña del usuario. Solo lectura de entrada (write_only)."
    )

    # Campo informativo de solo lectura para mostrar el nombre del rol asociado sin requerir peticiones extra
    rol_nombre = serializers.ReadOnlyField(
        source='rol.nombre',
        read_only=True,
        help_text="Nombre del rol asignado (campo descriptivo de solo lectura)"
    )

    class Meta:
        model = Usuario
        # Campos expuestos en la API REST para la entidad Usuario
        fields = [
            'id', 
            'username', 
            'password', 
            'email', 
            'first_name', 
            'last_name', 
            'rol', 
            'rol_nombre',
            'telefono', 
            'is_active', 
            'is_staff', 
            'date_joined'
        ]
        # Campos que no deben modificarse directamente desde la API
        read_only_fields = ['date_joined']

    def create(self, validated_data):
        """
        Sobrescribe la creación del usuario para asegurar el encriptado (hashing) de la contraseña.
        """
        # Extraemos la contraseña de los datos validados
        password = validated_data.pop('password', None)
        
        # Creamos la instancia del usuario con los demás campos
        usuario = Usuario(**validated_data)
        
        # Si se proporcionó una contraseña, la ciframos con set_password()
        if password:
            usuario.set_password(password)
        else:
            # En caso de no proveer contraseña, se deshabilita el inicio de sesión con contraseña
            usuario.set_unusable_password()
            
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        """
        Sobrescribe la actualización del usuario. Si se incluye una nueva contraseña,
        se encripta adecuadamente antes de guardar.
        """
        # Extraemos la contraseña si fue enviada en la petición (PUT/PATCH)
        password = validated_data.pop('password', None)

        # Actualizamos los demás campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Si se envió una nueva contraseña, la ciframos
        if password:
            instance.set_password(password)

        instance.save()
        return instance


# ==============================================================================
# 3. SERIALIZADOR DE CLIENTE
# ==============================================================================
class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Cliente.
    Gestiona el perfil comercial de los titulares/compradores del cementerio.
    """
    # Campo descriptivo de solo lectura para mostrar el username asociado si existe
    usuario_username = serializers.ReadOnlyField(
        source='usuario.username',
        read_only=True,
        help_text="Nombre de usuario del sistema asociado (si posee cuenta)"
    )

    class Meta:
        model = Cliente
        fields = [
            'id', 
            'cui', 
            'nombres', 
            'apellidos', 
            'telefono', 
            'direccion', 
            'correo', 
            'usuario', 
            'usuario_username'
        ]


# ==============================================================================
# 4. SERIALIZADOR DE BITÁCORA
# ==============================================================================
class BitacoraSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Bitacora (Auditoría de eventos del sistema).
    Muestra los cambios realizados en las tablas, snapshots JSON pre/post cambio y ejecutor.
    """
    # Campo de solo lectura para obtener el username del usuario que ejecutó la acción
    usuario_username = serializers.ReadOnlyField(
        source='usuario.username',
        read_only=True,
        help_text="Nombre de usuario que realizó la acción auditada"
    )

    class Meta:
        model = Bitacora
        fields = [
            'id', 
            'usuario', 
            'usuario_username', 
            'tabla_afectada', 
            'accion', 
            'registro_id', 
            'datos_anteriores', 
            'datos_nuevos', 
            'fecha_hora'
        ]
        # La fecha y hora no se puede alterar manualmente
        read_only_fields = ['fecha_hora']

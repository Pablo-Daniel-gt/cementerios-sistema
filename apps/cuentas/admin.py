"""
MÓDULO DE CUENTAS - CONFIGURACIÓN DEL PANEL DE ADMINISTRACIÓN (apps/cuentas/admin.py)

Este archivo registra y personaliza las interfaces visuales para la gestión de los 4 modelos
del Módulo A (Rol, Usuario, Cliente, Bitacora) en el panel de administración nativo de Django (/admin).

Características implementadas:
1. Visualización de columnas informativas personalizadas (Nombre, Correo, CUI/DPI, Rol, Teléfono, etc.).
2. Filtros laterales de búsqueda rápida por roles, estado activo y fechas.
3. Buscadores de texto para CUI, nombres, correo y nombres de usuario.
4. Protección de integridad en la Bitácora de Auditoría impidiendo la alteración o borrado de registros.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Rol, Usuario, Cliente, Bitacora


# ==============================================================================
# 1. ADMINISTRACIÓN DEL MODELO ROL
# ==============================================================================
@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    """
    Configuración visual para el catálogo de Roles del sistema.
    """
    # Columnas visibles en el listado principal de roles
    list_display = ('id', 'nombre', 'descripcion')
    
    # Campos que se utilizarán en la barra de búsqueda superior
    search_fields = ('nombre', 'descripcion')
    
    # Ordenamiento predeterminado secuencial por ID
    ordering = ('id',)


# ==============================================================================
# 2. ADMINISTRACIÓN DEL MODELO USUARIO (AUTENTICACIÓN Y ROLES)
# ==============================================================================
@admin.register(Usuario)
class CustomUsuarioAdmin(UserAdmin):
    """
    Configuración personalizada para la gestión del modelo Usuario en /admin.
    Extiende de `UserAdmin` para preservar los formularios de cambio y hashing seguro de contraseñas.
    """
    # Columnas mostradas en la tabla principal del listado de usuarios (incluye Rol y Correo)
    list_display = (
        'username', 
        'email', 
        'first_name', 
        'last_name', 
        'rol', 
        'telefono', 
        'is_active', 
        'is_staff'
    )
    
    # Filtros laterales para filtrar por estado activo, permisos de staff y rol asignado
    list_filter = ('rol', 'is_active', 'is_staff', 'is_superuser')
    
    # Búsqueda rápida por nombre de usuario, nombre, apellido o correo electrónico
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    # Orden alfabético predeterminado por username
    ordering = ('username',)
    
    # Se extienden los bloques de campos al editar un usuario para incluir 'rol' y 'telefono'
    fieldsets = UserAdmin.fieldsets + (
        ('Información Personal y Rol del Sistema', {
            'fields': ('rol', 'telefono')
        }),
    )
    
    # Se extienden los campos mostrados al crear un nuevo usuario desde el admin
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional Obligatoria', {
            'fields': ('email', 'rol', 'telefono')
        }),
    )


# ==============================================================================
# 3. ADMINISTRACIÓN DEL MODELO CLIENTE (TITULARES)
# ==============================================================================
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """
    Configuración visual para la gestión de Clientes / Titulares del cementerio.
    Muestra información de identificación oficial (CUI/DPI), datos de contacto y rol del usuario asociado.
    """
    # Columnas principales en la vista de lista (CUI/DPI, Nombre, Correo, Teléfono, Usuario y Rol)
    list_display = (
        'cui', 
        'nombres', 
        'apellidos', 
        'telefono', 
        'correo', 
        'usuario',
        'obtener_rol_usuario'
    )
    
    # Búsqueda por CUI (DPI), nombres, apellidos, correo o teléfono
    search_fields = ('cui', 'nombres', 'apellidos', 'correo', 'telefono')
    
    # Filtros laterales por rol del usuario vinculado
    list_filter = ('usuario__rol',)
    
    # Utiliza la búsqueda modal por ID para la relación con usuario (optimiza rendimiento en BDs grandes)
    raw_id_fields = ('usuario',)

    @admin.display(description='Rol del Usuario')
    def obtener_rol_usuario(self, obj):
        """Método helper para mostrar el nombre del rol del usuario vinculado en la tabla."""
        if obj.usuario and obj.usuario.rol:
            return obj.usuario.rol.nombre
        return "Sin Rol"


# ==============================================================================
# 4. ADMINISTRACIÓN DE LA BITÁCORA DE AUDITORÍA (SOLO LECTURA)
# ==============================================================================
@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    """
    Configuración del panel de auditoría del sistema.
    
    Integridad de Datos:
    Esta tabla es strictly de SOLO LECTURA. Se bloquea la adición, modificación
    y eliminación manual de registros de auditoría para garantizar el valor probatorio.
    """
    # Columnas mostradas en el listado de auditoría
    list_display = ('fecha_hora', 'usuario', 'tabla_afectada', 'accion', 'registro_id')
    
    # Filtros laterales por tipo de acción (INSERT/UPDATE/DELETE), tabla y fecha
    list_filter = ('accion', 'tabla_afectada', 'fecha_hora')
    
    # Búsqueda por nombre de tabla o datos del usuario ejecutor
    search_fields = ('tabla_afectada', 'usuario__username', 'usuario__email')
    
    # Todos los campos de detalle son únicamente de lectura
    readonly_fields = (
        'usuario', 
        'tabla_afectada', 
        'accion', 
        'registro_id', 
        'datos_anteriores', 
        'datos_nuevos', 
        'fecha_hora'
    )
    
    def has_add_permission(self, request):
        """Inhabilita el botón de crear nuevos registros de bitácora."""
        return False
        
    def has_change_permission(self, request, obj=None):
        """Inhabilita la edición de registros de bitácora."""
        return False
        
    def has_delete_permission(self, request, obj=None):
        """Inhabilita la eliminación de registros de bitácora."""
        return False

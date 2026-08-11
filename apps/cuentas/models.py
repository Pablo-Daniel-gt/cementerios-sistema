"""
MÓDULO DE CUENTAS - MODELOS DE DATOS (Módulo A: Autenticación, Usuarios, Clientes y Auditoría)

Este archivo define la estructura de la base de datos para la gestión de usuarios, roles,
clientes y la bitácora de auditoría del sistema.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


# ==============================================================================
# 1. MODELO ROL
# ==============================================================================
class Rol(models.Model):
    """
    Modelo que define los roles y niveles de permiso dentro del sistema.
    
    Ejemplos de roles:
    - Administrador: Acceso total al sistema y panel de control.
    - Asesor Comercial: Gestión de ventas, cotizaciones y clientes.
    - Cliente Propietario: Acceso de solo lectura a sus propiedades e información.
    """
    # Nombre identificador del rol (debe ser único para evitar duplicaciones)
    nombre = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="Nombre de Rol",
        help_text="Nombre único del rol (ej. Administrador, Asesor Comercial)"
    )
    # Descripción opcional sobre las funciones o alcance del rol
    descripcion = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Descripción",
        help_text="Explicación detallada de las funciones asignadas a este rol"
    )

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['nombre']  # Ordenar alfabéticamente por nombre de rol

    def __str__(self):
        # Muestra el nombre del rol al convertir el objeto a texto
        return self.nombre


# ==============================================================================
# 2. MODELO USUARIO (AUTENTICACIÓN Y DATOS DE ACCESO)
# ==============================================================================
class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado que hereda de `AbstractUser` de Django.
    
    ¿Por qué hereda de AbstractUser?
    - Permite mantener la compatibilidad nativa con la autenticación de Django.
    - Maneja de forma segura las contraseñas cifradas (hashing con PBKDF2/Argon2).
    - Mantiene compatibilidad total con el panel de administración (/admin) y librerías de permisos.
    - Permite agregar campos personalizados como 'rol' y 'telefono' manteniendo la estructura base.
    """
    # Clave foránea al modelo Rol. Se utiliza SET_NULL para no eliminar al usuario si se borra el rol.
    rol = models.ForeignKey(
        Rol, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='usuarios',
        verbose_name="Rol del Usuario",
        help_text="Rol asignado dentro del sistema"
    )
    
    # Correo electrónico único obligatorio para recuperaciones de contraseña y notificaciones
    email = models.EmailField(
        unique=True, 
        verbose_name="Correo Electrónico",
        help_text="Dirección de correo electrónico única del usuario"
    )
    
    # Campo adicional para almacenar el número telefónico de contacto
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono de Contacto",
        help_text="Número telefónico personal o laboral"
    )

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        # Representación en texto: muestra username y nombre completo si existe
        full_name = self.get_full_name()
        if full_name:
            return f"{self.username} ({full_name})"
        return self.username


# ==============================================================================
# 3. MODELO CLIENTE (PERFIL COMERCIAL / TITULAR)
# ==============================================================================
class Cliente(models.Model):
    """
    Modelo que representa el perfil del comprador, titular o cliente final.
    
    Nota de diseño:
    Un cliente no necesariamente debe tener acceso al sistema (usuario activo).
    Por esa razón, la relación con `Usuario` es opcional (`null=True, blank=True`).
    """
    # CUI / DPI (Código Único de Identificación de Guatemala) único por persona
    cui = models.CharField(
        max_length=13, 
        unique=True, 
        verbose_name="CUI / DPI",
        help_text="Número de documento de identificación (13 dígitos sin espacios)"
    )
    # Nombres completos del cliente
    nombres = models.CharField(
        max_length=100, 
        verbose_name="Nombres"
    )
    # Apellidos completos del cliente
    apellidos = models.CharField(
        max_length=100, 
        verbose_name="Apellidos"
    )
    # Teléfono principal de contacto del cliente
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono"
    )
    # Dirección residencial o fiscal del cliente
    direccion = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Dirección de Residencia"
    )
    # Correo electrónico personal del cliente
    correo = models.EmailField(
        blank=True, 
        null=True, 
        verbose_name="Correo Electrónico"
    )
    # Relación OneToOne opcional con el modelo Usuario si el cliente obtiene acceso al sistema
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cliente_perfil',
        verbose_name="Usuario de Sistema Asociado",
        help_text="Cuenta de usuario asignada si el cliente tiene acceso al portal web"
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        # Representación en texto: Nombres Apellidos (CUI)
        return f"{self.nombres} {self.apellidos} ({self.cui})"


# ==============================================================================
# 4. MODELO BITÁCORA (AUDITORÍA DE ACCIONES DEL SISTEMA)
# ==============================================================================
class Bitacora(models.Model):
    """
    Modelo para registrar auditorías de auditoría del sistema (log de eventos).
    Almacena quién realizó el cambio, sobre qué tabla, qué tipo de acción se ejecutó,
    los datos anteriores y los datos nuevos en formato JSON.
    """
    # Tipos de acciones auditadas
    ACCION_CHOICES = [
        ('INSERT', 'Creación (INSERT)'),
        ('UPDATE', 'Actualización (UPDATE)'),
        ('DELETE', 'Eliminación (DELETE)'),
    ]

    # Usuario que ejecutó la acción (opcional, null en caso de acciones automatizadas del sistema)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bitacoras',
        verbose_name="Usuario Ejecutor",
        help_text="Usuario del sistema que realizó la acción"
    )
    # Nombre de la tabla de la base de datos afectada por la operación
    tabla_afectada = models.CharField(
        max_length=100, 
        verbose_name="Tabla Afectada",
        help_text="Nombre de la entidad o tabla modificada (ej. cliente, lote, contrato)"
    )
    # Acción realizada: INSERT, UPDATE o DELETE
    accion = models.CharField(
        max_length=10, 
        choices=ACCION_CHOICES, 
        verbose_name="Acción Realizada"
    )
    # ID primario de la fila/registro que fue modificado
    registro_id = models.BigIntegerField(
        null=True, 
        blank=True, 
        verbose_name="ID de Registro Afectado",
        help_text="Llave primaria (ID) del registro auditado"
    )
    # Snapshot previo de los datos antes del cambio (formato JSON)
    datos_anteriores = models.JSONField(
        null=True, 
        blank=True, 
        verbose_name="Datos Anteriores (JSON)",
        help_text="Estado del registro antes de ser modificado o eliminado"
    )
    # Snapshot nuevo de los datos después del cambio (formato JSON)
    datos_nuevos = models.JSONField(
        null=True, 
        blank=True, 
        verbose_name="Datos Nuevos (JSON)",
        help_text="Estado del registro después del cambio o registro recién creado"
    )
    # Fecha y hora exacta de la acción registrada automáticamente
    fecha_hora = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Fecha y Hora de la Acción"
    )

    class Meta:
        verbose_name = "Bitácora"
        verbose_name_plural = "Bitácoras"
        ordering = ['-fecha_hora']  # Muestra los registros más recientes primero

    def __str__(self):
        fecha_str = self.fecha_hora.strftime("%Y-%m-%d %H:%M:%S") if self.fecha_hora else ""
        return f"{self.accion} en {self.tabla_afectada} - {fecha_str}"

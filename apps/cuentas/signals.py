"""
MÓDULO DE CUENTAS - SEÑALES DE AUDITORÍA AUTOMÁTICA (apps/cuentas/signals.py)

Este archivo implementa los receptores de señales (Django Signals) para registrar
automáticamente en la tabla Bitacora cualquier operación INSERT, UPDATE o DELETE
sobre los modelos de Rol, Usuario y Cliente (Requisito RNF-08).
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import Rol, Usuario, Cliente, Bitacora


def _serializar_instancia(instance):
    """
    Serializa los campos de una instancia a un diccionario seguro para JSON.
    Oculta información sensible como contraseñas.
    """
    try:
        data = model_to_dict(instance)
    except Exception:
        data = {}

    # Sanitización de datos sensibles
    if isinstance(instance, Usuario):
        data.pop('password', None)

    # Conversión de valores no serializables a string
    sanitized = {}
    for key, value in data.items():
        if value is None:
            sanitized[key] = None
        elif isinstance(value, (str, int, float, bool, list, dict)):
            sanitized[key] = value
        else:
            sanitized[key] = str(value)

    return sanitized


@receiver(post_save, sender=Rol)
@receiver(post_save, sender=Usuario)
@receiver(post_save, sender=Cliente)
def auditar_guardado(sender, instance, created, **kwargs):
    """
    Registra operaciones INSERT o UPDATE en la Bitácora de auditoría.
    """
    accion = 'INSERT' if created else 'UPDATE'
    datos = _serializar_instancia(instance)

    Bitacora.objects.create(
        usuario=getattr(instance, '_current_user', None),
        tabla_afectada=sender.__name__,
        accion=accion,
        registro_id=instance.pk,
        datos_nuevos=datos
    )


@receiver(post_delete, sender=Rol)
@receiver(post_delete, sender=Usuario)
@receiver(post_delete, sender=Cliente)
def auditar_eliminacion(sender, instance, **kwargs):
    """
    Registra operaciones DELETE en la Bitácora de auditoría.
    """
    datos = _serializar_instancia(instance)

    Bitacora.objects.create(
        usuario=getattr(instance, '_current_user', None),
        tabla_afectada=sender.__name__,
        accion='DELETE',
        registro_id=instance.pk,
        datos_anteriores=datos
    )

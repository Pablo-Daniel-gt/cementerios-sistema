"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - MODELOS DE DATOS (apps/inhumaciones/models.py)

Este archivo define la estructura relacional de la base de datos para la gestión operativa
de inhumaciones, registro biográfico de difuntos y anexos sanitarios/legales (RENAP / MSPAS).
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.conf import settings


# ==============================================================================
# 1. MODELO DIFUNTO (DATOS BIOGRÁFICOS Y DEFUNCIÓN)
# ==============================================================================
class Difunto(models.Model):
    """
    Almacena la información biográfica y legal de la persona fallecida.
    Cumple con la normativa guatemalteca (CUI RENAP de 13 caracteres opcional para neonatos).
    """
    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Difunto"
    )
    cui = models.CharField(
        max_length=13,
        unique=True,
        null=True,
        blank=True,
        verbose_name="CUI / DPI",
        help_text="Código Único de Identificación (13 dígitos). Opcional para recién nacidos sin CUI emitido por RENAP."
    )
    nombres = models.CharField(
        max_length=100,
        verbose_name="Nombres",
        help_text="Nombres completos de la persona fallecida"
    )
    apellidos = models.CharField(
        max_length=100,
        verbose_name="Apellidos",
        help_text="Apellidos completos de la persona fallecida"
    )
    fecha_nacimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Nacimiento"
    )
    fecha_defuncion = models.DateField(
        verbose_name="Fecha de Defunción"
    )
    causa_muerte = models.CharField(
        max_length=200,
        verbose_name="Causa de Muerte",
        help_text="Causa médica o legal del fallecimiento"
    )
    lugar_defuncion = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name="Lugar de Defunción",
        help_text="Centro hospitalario, domicilio u otra ubicación"
    )

    class Meta:
        db_table = 'inhumaciones_difunto'
        verbose_name = "Difunto"
        verbose_name_plural = "Difuntos"
        ordering = ['apellidos', 'nombres']
        indexes = [
            models.Index(fields=['cui'], name='idx_inhumaciones_difunto_cui')
        ]

    def clean(self):
        super().clean()
        if self.fecha_nacimiento and self.fecha_defuncion:
            if self.fecha_nacimiento > self.fecha_defuncion:
                raise ValidationError({
                    'fecha_nacimiento': 'La fecha de nacimiento no puede ser posterior a la fecha de defunción.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        cui_str = f" (CUI: {self.cui})" if self.cui else " (Sin CUI)"
        return f"{self.nombres} {self.apellidos}{cui_str}"


# ==============================================================================
# 2. MODELO REGISTRO INHUMACIÓN (EVENTO OPERATIVO Y ANEXOS LEGALES)
# ==============================================================================
class RegistroInhumacion(models.Model):
    """
    Almacena el evento operativo de inhumación/sepelio, vinculando al difunto,
    el espacio físico ocupado, el contrato comercial autorizante y el operador ejecutor.
    """
    ESTADO_INHUMACION_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('EXHUMADO', 'Exhumado'),
        ('TRASLADADO', 'Trasladado'),
    ]

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Registro Inhumación"
    )
    difunto = models.OneToOneField(
        Difunto,
        on_delete=models.RESTRICT,
        related_name='registro_inhumacion',
        verbose_name="Difunto",
        help_text="Persona fallecida objeto de la inhumación"
    )
    espacio = models.ForeignKey(
        'inventario.EspacioFisico',
        on_delete=models.RESTRICT,
        related_name='inhumaciones',
        verbose_name="Espacio Físico (Nicho)",
        help_text="Nicho o espacio físico asignado en el camposanto"
    )
    contrato = models.ForeignKey(
        'comercial.Contrato',
        on_delete=models.RESTRICT,
        related_name='inhumaciones',
        verbose_name="Contrato Comercial",
        help_text="Contrato de derechos de uso que autoriza el sepelio"
    )
    usuario_registro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='inhumaciones_registradas',
        verbose_name="Usuario Operador / Registro",
        help_text="Usuario del sistema que procesó el registro"
    )
    fecha_sepelio = models.DateTimeField(
        verbose_name="Fecha y Hora de Sepelio"
    )
    acta_renap_pdf = models.FileField(
        upload_to='inhumaciones/actas_renap/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
        verbose_name="Acta de Defunción RENAP (PDF)",
        help_text="Documento digitalizado del Acta de Defunción emitida por RENAP"
    )
    certificado_mspas_pdf = models.FileField(
        upload_to='inhumaciones/certificados_mspas/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
        null=True,
        blank=True,
        verbose_name="Certificado MSPAS (PDF)",
        help_text="Documento de autorización sanitaria emitido por MSPAS (si aplica)"
    )
    observaciones = models.TextField(
        null=True,
        blank=True,
        verbose_name="Observaciones",
        help_text="Notas u observaciones operativas adicionales"
    )
    estado_inhumacion = models.CharField(
        max_length=20,
        choices=ESTADO_INHUMACION_CHOICES,
        default='ACTIVA',
        verbose_name="Estado de Inhumación"
    )

    class Meta:
        db_table = 'inhumaciones_registro'
        verbose_name = "Registro de Inhumación"
        verbose_name_plural = "Registros de Inhumación"
        ordering = ['-fecha_sepelio']
        indexes = [
            models.Index(fields=['difunto'], name='idx_inhum_reg_difunto'),
            models.Index(fields=['espacio'], name='idx_inhum_reg_espacio'),
            models.Index(fields=['contrato'], name='idx_inhum_reg_contrato'),
        ]

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Inhumación #{self.id} - {self.difunto.nombres} {self.difunto.apellidos} en {self.espacio.codigo_unico_espacio} ({self.estado_inhumacion})"

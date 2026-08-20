"""
MÓDULO DE INVENTARIO Y CAMPOSANTO - MODELOS DE DATOS (Módulo B)

Este archivo define la estructura relacional de la base de datos para la gestión
de la jerarquía física del cementerio: Sector -> EstructuraFisica -> EspacioFisico,
así como sus clasificaciones y estados asociados.
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError


# ==============================================================================
# 1. MODELO SECTOR (ZONA DEL CEMENTERIO)
# ==============================================================================
class Sector(models.Model):
    """
    Representa una zona o sección geográfica del cementerio (ej. Sector A - Jardines).
    """
    id_sector = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Sector"
    )
    nombre_sector = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nombre del Sector",
        help_text="Nombre descriptivo del sector (ej. Sector A - Jardines de Paz)"
    )
    nomenclatura = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Nomenclatura",
        help_text="Código corto o sigla del sector (ej. SEC-A)"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Detalles o ubicación de la zona dentro del cementerio"
    )

    class Meta:
        db_table = 'inventario_sector'
        verbose_name = "Sector"
        verbose_name_plural = "Sectores"
        ordering = ['nombre_sector']

    def __str__(self):
        return f"{self.nombre_sector} ({self.nomenclatura})"


# ==============================================================================
# 2. MODELO TIPO DE ESTRUCTURA (CLASIFICACIÓN)
# ==============================================================================
class TipoEstructura(models.Model):
    """
    Clasifica las estructuras físicas del camposanto (ej. Pabellón, Mausoleo, Capilla).
    """
    id_tipo_estructura = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Tipo Estructura"
    )
    nombre_tipo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nombre de Tipo",
        help_text="Clasificación de construcción (ej. Pabellón, Mausoleo, Capilla)"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )

    class Meta:
        db_table = 'inventario_tipo_estructura'
        verbose_name = "Tipo de Estructura"
        verbose_name_plural = "Tipos de Estructura"
        ordering = ['nombre_tipo']

    def __str__(self):
        return self.nombre_tipo


# ==============================================================================
# 3. MODELO ESTADO DE ESPACIO (ESTADOS DISPONIBILIDAD Y COLORES)
# ==============================================================================
class EstadoEspacio(models.Model):
    """
    Define los estados de disponibilidad comercial y física de un espacio/nicho.
    Controla el color HEX para renderizar la Matriz 2D.
    Estados por defecto:
    - Disponible (#28A745)
    - Reservado (#FFC107)
    - Ocupado (#DC3545)
    - Mantenimiento (#17A2B8)
    """
    id_estado = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Estado"
    )
    nombre_estado = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nombre del Estado",
        help_text="Estado operacional (ej. Disponible, Reservado, Ocupado, Mantenimiento)"
    )
    class Meta:
        db_table = 'inventario_estado_espacio'
        verbose_name = "Estado de Espacio"
        verbose_name_plural = "Estados de Espacio"
        ordering = ['id_estado']

    def __str__(self):
        return self.nombre_estado


# ==============================================================================
# 4. MODELO ESTRUCTURA FÍSICA (PABELLÓN, MAUSOLEO, CAPILLA)
# ==============================================================================
class EstructuraFisica(models.Model):
    """
    Representa una construcción física en el cementerio organizada en filas x columnas.
    Calcula automáticamente la capacidad total de espacios.
    """
    id_estructura = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Estructura"
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name='estructuras',
        verbose_name="Sector"
    )
    tipo_estructura = models.ForeignKey(
        TipoEstructura,
        on_delete=models.PROTECT,
        related_name='estructuras',
        verbose_name="Tipo de Estructura"
    )
    nombre_estructura = models.CharField(
        max_length=100,
        verbose_name="Nombre de Estructura",
        help_text="Ejemplo: Pabellón San José"
    )
    codigo_estructura = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Código de Estructura",
        help_text="Código único identicador de la estructura (ej. PAB-01)"
    )
    total_filas = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Total de Filas (Y)",
        help_text="Número total de filas / alto en la grilla 2D"
    )
    total_columnas = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Total de Columnas (X)",
        help_text="Número total de columnas / ancho en la grilla 2D"
    )
    capacidad_total_espacios = models.PositiveIntegerField(
        editable=False,
        verbose_name="Capacidad Total de Espacios",
        help_text="Calculado automáticamente (filas * columnas)"
    )
    precio_estructura_completa = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Precio Estructura Completa",
        help_text="Aplica para venta global de mausoleos o capillas completas"
    )

    class Meta:
        db_table = 'inventario_estructura_fisica'
        verbose_name = "Estructura Física"
        verbose_name_plural = "Estructuras Físicas"
        ordering = ['sector', 'nombre_estructura']

    def save(self, *args, **kwargs):
        # Calcular capacidad total automáticamente
        self.capacidad_total_espacios = (self.total_filas or 0) * (self.total_columnas or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        sector_nom = self.sector.nomenclatura if self.sector_id else ""
        return f"{self.nombre_estructura} ({self.codigo_estructura}) - {sector_nom}"


# ==============================================================================
# 5. MODELO ESPACIO FÍSICO (NICHO INDIVIDUAL / UNIDAD)
# ==============================================================================
class EspacioFisico(models.Model):
    """
    Representa una unidad física individual (nicho) posicionada dentro de la grilla
    de una EstructuraFisica con coordenadas (posicion_fila, posicion_columna).
    Regla de dominio: Capacidad máxima de 1 difunto por nicho.
    """
    id_espacio = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Espacio"
    )
    estructura = models.ForeignKey(
        EstructuraFisica,
        on_delete=models.CASCADE,
        related_name='espacios',
        verbose_name="Estructura Física"
    )
    estado = models.ForeignKey(
        EstadoEspacio,
        on_delete=models.PROTECT,
        related_name='espacios',
        verbose_name="Estado del Espacio"
    )
    codigo_unico_espacio = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        verbose_name="Código Único de Espacio",
        help_text="Auto-generado: [SECTOR]-[ESTRUCTURA]-F[FILA]-C[COLUMNA]"
    )
    posicion_fila = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Posición Fila (Y)",
        help_text="Número de fila dentro de la estructura (1..total_filas)"
    )
    posicion_columna = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Posición Columna (X)",
        help_text="Número de columna dentro de la estructura (1..total_columnas)"
    )
    dimensiones = models.CharField(
        max_length=50,
        default="2.20m x 0.90m x 0.80m",
        verbose_name="Dimensiones",
        help_text="Largo x Ancho x Alto"
    )
    material_construccion = models.CharField(
        max_length=100,
        default="Concreto Reforzado",
        verbose_name="Material de Construcción"
    )
    precio_individual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Precio Individual",
        help_text="Precio de venta por nicho individual"
    )

    class Meta:
        db_table = 'inventario_espacio_fisico'
        verbose_name = "Espacio Físico"
        verbose_name_plural = "Espacios Físicos"
        ordering = ['estructura', 'posicion_fila', 'posicion_columna']
        constraints = [
            models.UniqueConstraint(
                fields=['estructura', 'posicion_fila', 'posicion_columna'],
                name='unique_posicion_por_estructura'
            )
        ]

    def clean(self):
        super().clean()
        if self.estructura_id:
            if self.posicion_fila > self.estructura.total_filas:
                raise ValidationError({
                    'posicion_fila': f'La fila ({self.posicion_fila}) excede el límite de la estructura ({self.estructura.total_filas}).'
                })
            if self.posicion_columna > self.estructura.total_columnas:
                raise ValidationError({
                    'posicion_columna': f'La columna ({self.posicion_columna}) excede el límite de la estructura ({self.estructura.total_columnas}).'
                })

    def save(self, *args, **kwargs):
        # Auto-generar código único de espacio si no fue provisto explícitamente
        if self.estructura_id and (not self.codigo_unico_espacio or self.codigo_unico_espacio.strip() == ""):
            sec_nom = self.estructura.sector.nomenclatura if self.estructura.sector_id else "SEC"
            est_cod = self.estructura.codigo_estructura
            self.codigo_unico_espacio = f"{sec_nom}-{est_cod}-F{self.posicion_fila}-C{self.posicion_columna}"
        
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        estado_nombre = self.estado.nombre_estado if self.estado_id else ""
        return f"{self.codigo_unico_espacio} ({estado_nombre})"

"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - MODELOS DE DATOS (apps/comercial/models.py)

Este archivo define la estructura relacional de la base de datos para la gestión
comercial del camposanto:
- ModalidadVenta
- EstadoContrato
- Contrato (RF-01: Cotizador y Venta Comercial)
- DetalleContratoEspacio (Asignación 100% normalizada de espacios/nichos)
- PlanPagoCuota (Plan de amortización a plazos RF-01)
- ControlMantenimiento (Cobro recurrente de mantenimiento camposanto RF-06)
- ReciboPago (Caja y transacciones financieras)
- DetallePagoRecibo (Desglose contable de los cobros en caja)
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.conf import settings
from datetime import date
from dateutil.relativedelta import relativedelta


# ==============================================================================
# 1. MODELO MODALIDAD DE VENTA
# ==============================================================================
class ModalidadVenta(models.Model):
    """
    Define los esquemas o tipos de planes comerciales de venta del camposanto.
    Ejemplos:
    - Contado (aplica_credito = False)
    - Crédito 12 Meses, 24 Meses, 36 Meses, 48 Meses, 60 Meses (aplica_credito = True)
    """
    id_modalidad = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Modalidad"
    )
    nombre_modalidad = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nombre de Modalidad",
        help_text="Ejemplo: Contado, Crédito 24 Meses"
    )
    aplica_credito = models.BooleanField(
        default=True,
        verbose_name="Aplica Crédito / Plazos",
        help_text="Indica si la modalidad requiere generación de plan de cuotas de amortización"
    )
    descripcion = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Descripción",
        help_text="Detalles comerciales de la modalidad"
    )

    class Meta:
        db_table = 'comercial_modalidad_venta'
        verbose_name = "Modalidad de Venta"
        verbose_name_plural = "Modalidades de Venta"
        ordering = ['id_modalidad']

    def __str__(self):
        return self.nombre_modalidad


# ==============================================================================
# 2. MODELO ESTADO DE CONTRATO
# ==============================================================================
class EstadoContrato(models.Model):
    """
    Define los estados por los que atraviesa un contrato comercial.
    Estados por defecto: Solicitado, Activo, Liquidado, Cancelado.
    """
    id_estado_contrato = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Estado Contrato"
    )
    nombre_estado_contrato = models.CharField(
        max_length=40,
        unique=True,
        verbose_name="Nombre de Estado",
        help_text="Ejemplo: Solicitado, Activo, Liquidado, Cancelado"
    )

    class Meta:
        db_table = 'comercial_estado_contrato'
        verbose_name = "Estado de Contrato"
        verbose_name_plural = "Estados de Contrato"
        ordering = ['id_estado_contrato']

    def __str__(self):
        return self.nombre_estado_contrato


# ==============================================================================
# 3. MODELO CONTRATO (ENCABEZADO DE ADQUISICIÓN COMERCIAL)
# ==============================================================================
class Contrato(models.Model):
    """
    Representa la venta o acuerdo comercial formal de derechos de uso a perpetuidad.
    Cumple con el requisito funcional RF-01 (Cotizador Financiero y Amortización).
    """
    id_contrato = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Contrato"
    )
    numero_contrato = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        verbose_name="Número de Contrato",
        help_text="Código único del contrato de venta (ej. CNT-2026-0001)"
    )
    cliente = models.ForeignKey(
        'cuentas.Cliente',
        on_delete=models.RESTRICT,
        related_name='contratos',
        verbose_name="Cliente / Titular"
    )
    usuario_asesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='contratos_asesorados',
        verbose_name="Asesor Comercial / Vendedor"
    )
    modalidad = models.ForeignKey(
        ModalidadVenta,
        on_delete=models.RESTRICT,
        related_name='contratos',
        verbose_name="Modalidad de Venta"
    )
    estado_contrato = models.ForeignKey(
        EstadoContrato,
        on_delete=models.RESTRICT,
        related_name='contratos',
        verbose_name="Estado de Contrato"
    )
    monto_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Monto Total (Q)",
        help_text="Precio total de venta negociado"
    )
    monto_enganche = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Monto de Enganche (Q)",
        help_text="Monto aportado como pago inicial o enganche"
    )
    monto_financiar = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Monto a Financiar (Q)",
        help_text="Saldo neto a diferir a plazos (monto_total - monto_enganche)"
    )
    plazo_meses = models.PositiveIntegerField(
        default=0,
        verbose_name="Plazo en Meses",
        help_text="Número de meses pactados para la amortización del saldo"
    )
    fecha_firma = models.DateField(
        default=date.today,
        verbose_name="Fecha de Firma del Contrato"
    )
    fecha_inicio_pago = models.DateField(
        default=date.today,
        verbose_name="Fecha de Inicio de Primer Pago"
    )

    class Meta:
        db_table = 'comercial_contrato'
        verbose_name = "Contrato Comercial"
        verbose_name_plural = "Contratos Comerciales"
        ordering = ['-fecha_firma', '-id_contrato']

    def clean(self):
        super().clean()
        if self.monto_total is not None and self.monto_enganche is not None:
            if self.monto_enganche > self.monto_total:
                raise ValidationError({
                    'monto_enganche': 'El monto de enganche no puede exceder el monto total del contrato.'
                })

    def save(self, *args, **kwargs):
        # Autogenerar número de contrato correlativo secuencial si no fue asignado
        if not self.numero_contrato:
            anio = date.today().year
            prefijo = f"CNT-{anio}-"
            ultimo = Contrato.objects.filter(numero_contrato__startswith=prefijo).count() + 1
            self.numero_contrato = f"{prefijo}{ultimo:04d}"

        # Autocalcular saldo a financiar antes de guardar
        if self.monto_total is not None and self.monto_enganche is not None:
            self.monto_financiar = self.monto_total - self.monto_enganche

        # Si la modalidad es Contado (aplica_credito == False), forzar plazo a 0 y financiar a 0
        if self.modalidad_id and not self.modalidad.aplica_credito:
            self.monto_financiar = 0
            self.plazo_meses = 0

        self.full_clean()
        super().save(*args, **kwargs)

    def generar_plan_amortizacion(self):
        """
        Genera automáticamente el plan de $N$ cuotas mensuales fijas en `PlanPagoCuota`
        con fechas de vencimiento mensuales consecutivas a partir de `fecha_inicio_pago`.
        (Lógica de negocio del requisito RF-01).
        """
        if not self.modalidad.aplica_credito or self.plazo_meses <= 0 or self.monto_financiar <= 0:
            return []

        # Eliminar cuotas previas sólo si están en estado PENDIENTE y no tienen cobros asociados
        self.plan_cuotas.filter(estado_cuota='PENDIENTE', detalles_recibo__isnull=True).delete()

        # Calcular cuota base
        monto_cuota_base = round(self.monto_financiar / self.plazo_meses, 2)
        # Ajustar posible residuo por redondeo en la última cuota
        suma_cuotas = monto_cuota_base * self.plazo_meses
        diferencia = round(self.monto_financiar - suma_cuotas, 2)

        cuotas_creadas = []
        fecha_actual = self.fecha_inicio_pago

        for i in range(1, self.plazo_meses + 1):
            monto_final_cuota = monto_cuota_base
            if i == self.plazo_meses:
                monto_final_cuota += diferencia

            cuota = PlanPagoCuota.objects.create(
                contrato=self,
                numero_cuota=i,
                monto_cuota=monto_final_cuota,
                fecha_vencimiento=fecha_actual,
                estado_cuota='PENDIENTE'
            )
            cuotas_creadas.append(cuota)
            # Avanzar un mes exacto
            fecha_actual = fecha_actual + relativedelta(months=1)

        return cuotas_creadas

    def __str__(self):
        return f"{self.numero_contrato} - {self.cliente.nombres} {self.cliente.apellidos}"


# ==============================================================================
# 4. MODELO DETALLE CONTRATO ESPACIO (TABLA INTERMEDIA DE INMUEBLES)
# ==============================================================================
class DetalleContratoEspacio(models.Model):
    """
    Vincula 1 Contrato con 1 o N Espacios Físicos (Nichos).
    Garantiza la asignación 100% normalizada. Un nicho solo puede estar en 1 contrato activo.
    """
    id_detalle_contrato = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Detalle Contrato Espacio"
    )
    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.CASCADE,
        related_name='detalles_espacio',
        verbose_name="Contrato"
    )
    espacio = models.OneToOneField(
        'inventario.EspacioFisico',
        on_delete=models.RESTRICT,
        related_name='detalle_contrato',
        verbose_name="Espacio Físico (Nicho)"
    )
    precio_venta_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Precio de Venta Unitario (Q)"
    )

    class Meta:
        db_table = 'comercial_detalle_contrato_espacio'
        verbose_name = "Detalle Contrato Espacio"
        verbose_name_plural = "Detalles de Contrato - Espacios"
        ordering = ['id_detalle_contrato']

    def __str__(self):
        return f"Contrato {self.contrato.numero_contrato} -> Espacio {self.espacio.codigo_unico_espacio}"


# ==============================================================================
# 5. MODELO PLAN DE PAGO DE CUOTAS (AMORTIZACIÓN DE INMUEBLE)
# ==============================================================================
class PlanPagoCuota(models.Model):
    """
    Almacena cada cuota del plan de amortización del crédito del inmueble.
    (Requisito RF-01).
    """
    ESTADO_CUOTA_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('PARCIAL', 'Parcial'),
        ('VENCIDA', 'Vencida'),
    ]

    id_plan = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Plan Cuota"
    )
    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.CASCADE,
        related_name='plan_cuotas',
        verbose_name="Contrato"
    )
    numero_cuota = models.PositiveIntegerField(
        verbose_name="Número de Cuota",
        validators=[MinValueValidator(1)]
    )
    monto_cuota = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name="Monto de Cuota (Q)"
    )
    fecha_vencimiento = models.DateField(
        verbose_name="Fecha de Vencimiento"
    )
    estado_cuota = models.CharField(
        max_length=20,
        choices=ESTADO_CUOTA_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado de Cuota"
    )

    class Meta:
        db_table = 'comercial_plan_pago_cuota'
        verbose_name = "Cuota de Plan de Pago"
        verbose_name_plural = "Cuotas de Plan de Pago"
        ordering = ['contrato', 'numero_cuota']
        constraints = [
            models.UniqueConstraint(
                fields=['contrato', 'numero_cuota'],
                name='uq_contrato_num_cuota'
            )
        ]

    def __str__(self):
        return f"Cuota #{self.numero_cuota} ({self.contrato.numero_contrato}) - Q{self.monto_cuota} ({self.estado_cuota})"


# ==============================================================================
# 6. MODELO CONTROL DE MANTENIMIENTO (COBRO RECURRENTE ANUAL)
# ==============================================================================
class ControlMantenimiento(models.Model):
    """
    Administra el cobro anual recurrente por mantenimiento del camposanto.
    (Requisito RF-06: Alertas de Cobranza y Mora).
    """
    ESTADO_COBRO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('EN_MORA', 'En Mora'),
    ]

    id_control_mante = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Control Mantenimiento"
    )
    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.CASCADE,
        related_name='control_mantenimientos',
        verbose_name="Contrato"
    )
    anio_periodo = models.PositiveIntegerField(
        verbose_name="Año del Período",
        help_text="Ejemplo: 2026"
    )
    monto_mantenimiento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Monto de Mantenimiento (Q)"
    )
    fecha_limite_pago = models.DateField(
        verbose_name="Fecha Límite de Pago"
    )
    fecha_pago_real = models.DateField(
        blank=True,
        null=True,
        verbose_name="Fecha de Pago Real"
    )
    estado_cobro = models.CharField(
        max_length=20,
        choices=ESTADO_COBRO_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado de Cobro"
    )

    class Meta:
        db_table = 'comercial_control_mantenimiento'
        verbose_name = "Control de Mantenimiento Anual"
        verbose_name_plural = "Controles de Mantenimiento Anual"
        ordering = ['-anio_periodo', 'contrato']
        constraints = [
            models.UniqueConstraint(
                fields=['contrato', 'anio_periodo'],
                name='uq_contrato_periodo_mante'
            )
        ]

    def evaluar_mora(self):
        """
        Verifica si el cobro de mantenimiento ha vencido y actualiza su estado a EN_MORA.
        (Lógica del requisito RF-06).
        """
        if self.estado_cobro == 'PENDIENTE' and self.fecha_limite_pago < date.today():
            self.estado_cobro = 'EN_MORA'
            self.save(update_fields=['estado_cobro'])

    def __str__(self):
        return f"Mantenimiento {self.anio_periodo} - {self.contrato.numero_contrato} - Q{self.monto_mantenimiento} ({self.estado_cobro})"


# ==============================================================================
# 7. MODELO RECIBO DE PAGO (MAESTRO DE CAJA / TRANSACCIÓN)
# ==============================================================================
class ReciboPago(models.Model):
    """
    Maestro de transacciones de caja para registrar pagos recibidos de clientes.
    """
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('DEPOSITO_BANCO', 'Depósito Bancario'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('TARJETA', 'Tarjeta de Crédito / Débito'),
    ]

    id_recibo = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Recibo"
    )
    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.RESTRICT,
        related_name='recibos_pago',
        verbose_name="Contrato"
    )
    usuario_cajero = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='recibos_cobrados',
        verbose_name="Cajero / Operador de Caja"
    )
    correlativo_recibo = models.BigIntegerField(
        unique=True,
        verbose_name="Correlativo de Recibo de Caja",
        help_text="Número secuencial único impreso en el recibo de caja"
    )
    fecha_transaccion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y Hora de Transacción"
    )
    monto_ingresado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name="Monto Ingresado (Q)"
    )
    metodo_pago = models.CharField(
        max_length=30,
        choices=METODO_PAGO_CHOICES,
        default='EFECTIVO',
        verbose_name="Método de Pago"
    )
    numero_boleta_banco = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Número de Boleta / Referencia Bancaria",
        help_text="Requerido si el pago es transferencia, depósito o tarjeta"
    )
    observaciones = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Observaciones / Notas"
    )

    class Meta:
        db_table = 'comercial_recibo_pago'
        verbose_name = "Recibo de Pago (Caja)"
        verbose_name_plural = "Recibos de Pago (Caja)"
        ordering = ['-fecha_transaccion', '-id_recibo']

    def clean(self):
        super().clean()
        if self.metodo_pago in ['DEPOSITO_BANCO', 'TRANSFERENCIA', 'TARJETA'] and not self.numero_boleta_banco:
            raise ValidationError({
                'numero_boleta_banco': 'El número de boleta o transferencia es obligatorio para pagos bancarios o con tarjeta.'
            })

    def save(self, *args, **kwargs):
        # Autogenerar correlativo secuencial si no ha sido establecido
        if not self.correlativo_recibo:
            ultimo = ReciboPago.objects.aggregate(models.Max('correlativo_recibo'))['correlativo_recibo__max']
            self.correlativo_recibo = (ultimo or 10000) + 1
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Recibo #{self.correlativo_recibo} - {self.contrato.numero_contrato} - Q{self.monto_ingresado}"


# ==============================================================================
# 8. MODELO DETALLE DE PAGO RECIBO (DESGLOSE CONTABLE)
# ==============================================================================
class DetallePagoRecibo(models.Model):
    """
    Desglose contable de las aplicaciones financieras asignadas en un recibo de caja.
    Asocia un cobro a una cuota del plan de crédito o a un cobro de mantenimiento anual.
    """
    CONCEPTO_CHOICES = [
        ('ENGANCHE', 'Enganche Inicial'),
        ('CUOTA_AMORTIZACION', 'Cuota de Amortización'),
        ('MANTENIMIENTO_ANUAL', 'Mantenimiento Anual'),
        ('OTRO', 'Otro Concepto'),
    ]

    id_detalle = models.BigAutoField(
        primary_key=True,
        verbose_name="ID Detalle Recibo"
    )
    recibo = models.ForeignKey(
        ReciboPago,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name="Recibo de Pago Maestro"
    )
    plan_cuota = models.ForeignKey(
        PlanPagoCuota,
        on_delete=models.RESTRICT,
        blank=True,
        null=True,
        related_name='detalles_recibo',
        verbose_name="Cuota de Plan de Amortización Saldada"
    )
    control_mantenimiento = models.ForeignKey(
        ControlMantenimiento,
        on_delete=models.RESTRICT,
        blank=True,
        null=True,
        related_name='detalles_recibo',
        verbose_name="Control de Mantenimiento Saldado"
    )
    concepto = models.CharField(
        max_length=50,
        choices=CONCEPTO_CHOICES,
        verbose_name="Concepto de Pago"
    )
    monto_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name="Monto Aplicado (Q)"
    )

    class Meta:
        db_table = 'comercial_detalle_pago_recibo'
        verbose_name = "Detalle de Pago en Recibo"
        verbose_name_plural = "Detalles de Pago en Recibo"
        ordering = ['id_detalle']

    def clean(self):
        super().clean()
        # Validación de la restricción chk_asociacion_detalle
        if self.plan_cuota and self.control_mantenimiento:
            raise ValidationError("Un detalle de pago no puede asociarse simultáneamente a una cuota de crédito y a un mantenimiento.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Detalle Recibo #{self.recibo.correlativo_recibo}: {self.concepto} - Q{self.monto_aplicado}"

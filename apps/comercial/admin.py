"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - PANEL DE ADMINISTRACIÓN (apps/comercial/admin.py)

Registra los modelos de la app comercial en el Admin de Django con inlines
y columnas detalladas para auditoría visual.
"""

from django.contrib import admin
from .models import (
    ModalidadVenta,
    EstadoContrato,
    Contrato,
    DetalleContratoEspacio,
    PlanPagoCuota,
    ControlMantenimiento,
    ReciboPago,
    DetallePagoRecibo
)


# ==============================================================================
# INLINES
# ==============================================================================
class DetalleContratoEspacioInline(admin.TabularInline):
    model = DetalleContratoEspacio
    extra = 1
    autocomplete_fields = ['espacio']


class PlanPagoCuotaInline(admin.TabularInline):
    model = PlanPagoCuota
    extra = 0
    readonly_fields = ['numero_cuota', 'monto_cuota', 'fecha_vencimiento']
    can_delete = False


class ControlMantenimientoInline(admin.TabularInline):
    model = ControlMantenimiento
    extra = 0


class DetallePagoReciboInline(admin.TabularInline):
    model = DetallePagoRecibo
    extra = 1


# ==============================================================================
# REGISTROS ADMIN
# ==============================================================================
@admin.register(ModalidadVenta)
class ModalidadVentaAdmin(admin.ModelAdmin):
    list_display = ('id_modalidad', 'nombre_modalidad', 'aplica_credito', 'descripcion')
    list_filter = ('aplica_credito',)
    search_fields = ('nombre_modalidad',)


@admin.register(EstadoContrato)
class EstadoContratoAdmin(admin.ModelAdmin):
    list_display = ('id_estado_contrato', 'nombre_estado_contrato')
    search_fields = ('nombre_estado_contrato',)


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    list_display = (
        'numero_contrato',
        'cliente',
        'usuario_asesor',
        'modalidad',
        'estado_contrato',
        'monto_total',
        'monto_enganche',
        'monto_financiar',
        'plazo_meses',
        'fecha_firma'
    )
    list_filter = ('modalidad', 'estado_contrato', 'fecha_firma')
    search_fields = ('numero_contrato', 'cliente__cui', 'cliente__nombres', 'cliente__apellidos')
    inlines = [DetalleContratoEspacioInline, PlanPagoCuotaInline, ControlMantenimientoInline]
    date_hierarchy = 'fecha_firma'


@admin.register(PlanPagoCuota)
class PlanPagoCuotaAdmin(admin.ModelAdmin):
    list_display = ('id_plan', 'contrato', 'numero_cuota', 'monto_cuota', 'fecha_vencimiento', 'estado_cuota')
    list_filter = ('estado_cuota', 'fecha_vencimiento')
    search_fields = ('contrato__numero_contrato', 'contrato__cliente__nombres')


@admin.register(ControlMantenimiento)
class ControlMantenimientoAdmin(admin.ModelAdmin):
    list_display = ('id_control_mante', 'contrato', 'anio_periodo', 'monto_mantenimiento', 'fecha_limite_pago', 'estado_cobro')
    list_filter = ('estado_cobro', 'anio_periodo')
    search_fields = ('contrato__numero_contrato', 'contrato__cliente__nombres')


@admin.register(ReciboPago)
class ReciboPagoAdmin(admin.ModelAdmin):
    list_display = (
        'correlativo_recibo',
        'contrato',
        'usuario_cajero',
        'monto_ingresado',
        'metodo_pago',
        'numero_boleta_banco',
        'fecha_transaccion'
    )
    list_filter = ('metodo_pago', 'fecha_transaccion')
    search_fields = ('correlativo_recibo', 'contrato__numero_contrato', 'numero_boleta_banco')
    inlines = [DetallePagoReciboInline]
    date_hierarchy = 'fecha_transaccion'


@admin.register(DetallePagoRecibo)
class DetallePagoReciboAdmin(admin.ModelAdmin):
    list_display = ('id_detalle', 'recibo', 'concepto', 'monto_aplicado', 'plan_cuota', 'control_mantenimiento')
    list_filter = ('concepto',)
    search_fields = ('recibo__correlativo_recibo', 'recibo__contrato__numero_contrato')

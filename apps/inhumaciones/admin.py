"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - PANEL DE ADMINISTRACIÓN (apps/inhumaciones/admin.py)

Registra los modelos `Difunto` y `RegistroInhumacion` en el Admin de Django con filtros por estado de inhumación,
buscador avanzado y visualización directa de adjuntos digitales (PDF de RENAP y MSPAS).
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Difunto, RegistroInhumacion


# ==============================================================================
# 1. INLINE DE REGISTRO DE INHUMACIÓN PARA EL DIFUNTO
# ==============================================================================
class RegistroInhumacionInline(admin.StackedInline):
    model = RegistroInhumacion
    extra = 0
    raw_id_fields = ['espacio', 'contrato', 'usuario_registro']
    readonly_fields = ['ver_acta_renap', 'ver_certificado_mspas']

    @admin.display(description="Acta RENAP (PDF)")
    def ver_acta_renap(self, obj):
        if obj and obj.acta_renap_pdf:
            return format_html('<a href="{}" target="_blank" style="font-weight: bold; color: #0d6efd;">📄 Ver PDF RENAP</a>', obj.acta_renap_pdf.url)
        return "No adjuntado"

    @admin.display(description="Certificado MSPAS (PDF)")
    def ver_certificado_mspas(self, obj):
        if obj and obj.certificado_mspas_pdf:
            return format_html('<a href="{}" target="_blank" style="font-weight: bold; color: #198754;">📄 Ver PDF MSPAS</a>', obj.certificado_mspas_pdf.url)
        return "No adjuntado"


# ==============================================================================
# 2. ADMINISTRACIÓN DE DIFUNTOS
# ==============================================================================
@admin.register(Difunto)
class DifuntoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cui',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'fecha_defuncion',
        'causa_muerte',
        'lugar_defuncion',
    )
    search_fields = ('cui', 'nombres', 'apellidos', 'causa_muerte', 'lugar_defuncion')
    list_filter = ('fecha_defuncion',)
    date_hierarchy = 'fecha_defuncion'
    inlines = [RegistroInhumacionInline]
    ordering = ('-id',)


# ==============================================================================
# 3. ADMINISTRACIÓN DE REGISTROS DE INHUMACIÓN
# ==============================================================================
@admin.register(RegistroInhumacion)
class RegistroInhumacionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'difunto',
        'espacio',
        'contrato',
        'fecha_sepelio',
        'estado_inhumacion',
        'usuario_registro',
        'ver_acta_renap',
        'ver_certificado_mspas',
    )
    list_filter = (
        'estado_inhumacion',
        'fecha_sepelio',
        'espacio__estructura__sector',
    )
    search_fields = (
        'difunto__nombres',
        'difunto__apellidos',
        'difunto__cui',
        'espacio__codigo_unico_espacio',
        'contrato__numero_contrato',
        'observaciones',
    )
    raw_id_fields = ('difunto', 'espacio', 'contrato', 'usuario_registro')
    date_hierarchy = 'fecha_sepelio'
    ordering = ('-fecha_sepelio',)

    @admin.display(description="Acta RENAP (PDF)")
    def ver_acta_renap(self, obj):
        if obj.acta_renap_pdf:
            return format_html('<a href="{}" target="_blank" style="font-weight: bold; color: #0d6efd;">📄 Ver PDF RENAP</a>', obj.acta_renap_pdf.url)
        return "Sin archivo"

    @admin.display(description="Certificado MSPAS (PDF)")
    def ver_certificado_mspas(self, obj):
        if obj.certificado_mspas_pdf:
            return format_html('<a href="{}" target="_blank" style="font-weight: bold; color: #198754;">📄 Ver PDF MSPAS</a>', obj.certificado_mspas_pdf.url)
        return "Sin archivo"

"""
MÓDULO DE INVENTARIO - PANEL DE ADMINISTRACIÓN (apps/inventario/admin.py)

Este archivo registra y personaliza los modelos del Módulo B (Sector, TipoEstructura,
EstadoEspacio, EstructuraFisica y EspacioFisico) en el panel de administración nativo de Django (/admin).

Incluye acciones administrativas para la generación masiva/en lote de nichos por estructura.
"""

from django.contrib import admin, messages
from .models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico


# ==============================================================================
# 1. ADMINISTRACIÓN DE SECTORES
# ==============================================================================
@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ('id_sector', 'nombre_sector', 'nomenclatura', 'descripcion')
    search_fields = ('nombre_sector', 'nomenclatura', 'descripcion')
    ordering = ('id_sector',)


# ==============================================================================
# 2. ADMINISTRACIÓN DE TIPOS DE ESTRUCTURA
# ==============================================================================
@admin.register(TipoEstructura)
class TipoEstructuraAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_estructura', 'nombre_tipo', 'descripcion')
    search_fields = ('nombre_tipo', 'descripcion')
    ordering = ('id_tipo_estructura',)


# ==============================================================================
# 3. ADMINISTRACIÓN DE ESTADOS DE ESPACIO
# ==============================================================================
@admin.register(EstadoEspacio)
class EstadoEspacioAdmin(admin.ModelAdmin):
    list_display = ('id_estado', 'nombre_estado')
    search_fields = ('nombre_estado',)
    ordering = ('id_estado',)


# ==============================================================================
# 4. INLINE DE ESPACIOS FÍSICOS PARA ESTRUCTURA FÍSICA
# ==============================================================================
class EspacioFisicoInline(admin.TabularInline):
    model = EspacioFisico
    extra = 0
    fields = ('codigo_unico_espacio', 'posicion_fila', 'posicion_columna', 'estado', 'precio_individual')
    readonly_fields = ('codigo_unico_espacio',)
    show_change_link = True


# ==============================================================================
# 5. ADMINISTRACIÓN DE ESTRUCTURAS FÍSICAS (PABELLONES / MAUSOLEOS)
# ==============================================================================
@admin.register(EstructuraFisica)
class EstructuraFisicaAdmin(admin.ModelAdmin):
    list_display = (
        'id_estructura',
        'codigo_estructura',
        'nombre_estructura',
        'sector',
        'tipo_estructura',
        'total_filas',
        'total_columnas',
        'capacidad_total_espacios',
        'precio_estructura_completa',
    )
    search_fields = ('codigo_estructura', 'nombre_estructura')
    list_filter = ('sector', 'tipo_estructura')
    inlines = [EspacioFisicoInline]
    ordering = ('id_estructura',)
    actions = ['generar_espacios_lote']

    @admin.action(description="Generar lote de nichos (espacios físicos) para las estructuras seleccionadas")
    def generar_espacios_lote(self, request, queryset):
        """
        Acción administrativa para generar automáticamente los espacios físicos (nichos)
        de la grilla (filas x columnas) para las estructuras seleccionadas que no los posean.
        """
        estado_disponible, _ = EstadoEspacio.objects.get_or_create(
            nombre_estado='Disponible'
        )

        total_creados = 0
        for estructura in queryset:
            for fila in range(1, estructura.total_filas + 1):
                for col in range(1, estructura.total_columnas + 1):
                    _, created = EspacioFisico.objects.get_or_create(
                        estructura=estructura,
                        posicion_fila=fila,
                        posicion_columna=col,
                        defaults={
                            'estado': estado_disponible,
                            'precio_individual': estructura.precio_estructura_completa / estructura.capacidad_total_espacios if estructura.precio_estructura_completa and estructura.capacidad_total_espacios else None
                        }
                    )
                    if created:
                        total_creados += 1

        self.message_user(
            request,
            f"Se han generado exitosamente {total_creados} espacios físicos (nichos) para {queryset.count()} estructura(s).",
            messages.SUCCESS
        )


# ==============================================================================
# 6. ADMINISTRACIÓN DE ESPACIOS FÍSICOS (NICHOS)
# ==============================================================================
@admin.register(EspacioFisico)
class EspacioFisicoAdmin(admin.ModelAdmin):
    list_display = (
        'id_espacio',
        'codigo_unico_espacio',
        'estructura',
        'posicion_fila',
        'posicion_columna',
        'estado',
        'precio_individual',
        'dimensiones',
        'material_construccion'
    )
    list_filter = ('estado', 'estructura__sector', 'estructura__tipo_estructura', 'estructura')
    search_fields = ('codigo_unico_espacio', 'estructura__nombre_estructura', 'estructura__codigo_estructura')
    ordering = ('id_espacio',)
    raw_id_fields = ('estructura',)

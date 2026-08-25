"""
MÓDULO DE INVENTARIO - VISTAS DE LA API REST (apps/inventario/views.py)

Este archivo define los `ModelViewSet` de DRF para las entidades del Módulo B:
- SectorViewSet
- TipoEstructuraViewSet
- EstadoEspacioViewSet
- EstructuraFisicaViewSet (incluye la acción personalizada @action /matriz/ y /generar-lote/)
- EspacioFisicoViewSet
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico
from .serializers import (
    SectorSerializer,
    TipoEstructuraSerializer,
    EstadoEspacioSerializer,
    EstructuraFisicaSerializer,
    EspacioFisicoSerializer,
    EstructuraMatrizSerializer
)


# ==============================================================================
# 1. VIEWSET DE SECTOR
# ==============================================================================
class SectorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD sobre la entidad Sector (Zonas del cementerio).
    """
    queryset = Sector.objects.all().order_by('nombre_sector')
    serializer_class = SectorSerializer


# ==============================================================================
# 2. VIEWSET DE TIPO DE ESTRUCTURA
# ==============================================================================
class TipoEstructuraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD sobre la entidad TipoEstructura (Pabellón, Mausoleo, Capilla).
    """
    queryset = TipoEstructura.objects.all().order_by('nombre_tipo')
    serializer_class = TipoEstructuraSerializer


# ==============================================================================
# 3. VIEWSET DE ESTADO DE ESPACIO
# ==============================================================================
class EstadoEspacioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD sobre los Estados de Espacio (Disponible, Reservado, Ocupado, Mantenimiento).
    """
    queryset = EstadoEspacio.objects.all().order_by('id_estado')
    serializer_class = EstadoEspacioSerializer


# ==============================================================================
# 4. VIEWSET DE ESTRUCTURA FÍSICA
# ==============================================================================
class EstructuraFisicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Estructuras Físicas.
    Incluye los endpoints para la Matriz Visual 2D (RF-02) y la generación en lote de nichos.
    """
    queryset = EstructuraFisica.objects.all().select_related('sector', 'tipo_estructura').order_by('id_estructura')
    serializer_class = EstructuraFisicaSerializer

    @extend_schema(
        summary="Obtener la Matriz Visual 2D de una Estructura Física (RF-02)",
        description="Retorna la información de la estructura y el arreglo anidado de espacios físicos (nichos) ordenados por fila y columna.",
        responses={200: EstructuraMatrizSerializer}
    )
    @action(detail=True, methods=['get'], url_path='matriz', serializer_class=EstructuraMatrizSerializer)
    def matriz(self, request, pk=None):
        """
        GET /api/v1/inventario/estructuras/{id}/matriz/
        Provee la estructura de datos en grilla 2D necesaria para la interfaz interactiva.
        """
        estructura = self.get_object()
        serializer = EstructuraMatrizSerializer(estructura)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Generar Lote de Nichos/Espacios Físicos para una Estructura",
        description="Crea automáticamente los espacios físicos para la grilla (filas x columnas) de una estructura.",
        responses={200: OpenApiResponse(description="Espacios creados o existentes")}
    )
    @action(detail=True, methods=['post'], url_path='generar-lote')
    def generar_lote(self, request, pk=None):
        """
        POST /api/v1/inventario/estructuras/{id}/generar-lote/
        Genera en lote todos los nichos faltantes de la estructura seleccionada.
        """
        estructura = self.get_object()
        estado_disponible, _ = EstadoEspacio.objects.get_or_create(
            nombre_estado='Disponible'
        )

        precio_ind = None
        if estructura.precio_estructura_completa and estructura.capacidad_total_espacios:
            precio_ind = estructura.precio_estructura_completa / estructura.capacidad_total_espacios

        total_creados = 0
        for fila in range(1, estructura.total_filas + 1):
            for col in range(1, estructura.total_columnas + 1):
                _, created = EspacioFisico.objects.get_or_create(
                    estructura=estructura,
                    posicion_fila=fila,
                    posicion_columna=col,
                    defaults={
                        'estado': estado_disponible,
                        'precio_individual': precio_ind
                    }
                )
                if created:
                    total_creados += 1

        return Response({
            'mensaje': f'Se han generado {total_creados} nichos (espacios físicos) para "{estructura.nombre_estructura}".',
            'creados': total_creados,
            'total_capacidad': estructura.capacidad_total_espacios
        }, status=status.HTTP_200_OK)


# ==============================================================================
# 5. VIEWSET DE ESPACIO FÍSICO
# ==============================================================================
class EspacioFisicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD de Espacios Físicos (Nichos individuales).
    Permite filtrado dinámico por `estructura` y por `estado`.
    """
    queryset = EspacioFisico.objects.all().select_related('estructura', 'estado').order_by('estructura', 'posicion_fila', 'posicion_columna')
    serializer_class = EspacioFisicoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estructura_id = self.request.query_params.get('estructura', None)
        estado_id = self.request.query_params.get('estado', None)
        solo_disponibles = self.request.query_params.get('solo_disponibles', None)

        if estructura_id:
            queryset = queryset.filter(estructura_id=estructura_id)
        if estado_id:
            queryset = queryset.filter(estado_id=estado_id)
        if solo_disponibles == 'true':
            queryset = queryset.filter(estado__nombre_estado='Disponible', detalle_contrato__isnull=True)

        return queryset


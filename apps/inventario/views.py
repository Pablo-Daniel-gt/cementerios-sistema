"""
MÓDULO DE INVENTARIO - VISTAS DE LA API REST (apps/inventario/views.py)

Este archivo define los `ModelViewSet` de DRF para las entidades del Módulo B:
- SectorViewSet
- TipoEstructuraViewSet
- EstadoEspacioViewSet
- EstructuraFisicaViewSet (incluye la acción personalizada @action /matriz/ y /generar-lote/)
- EspacioFisicoViewSet
"""

from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
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
# 0. VISTA PÚBLICA DE CATÁLOGO DE ESPACIOS E INMUEBLES
# ==============================================================================
class CatalogoPublicoEspaciosView(APIView):
    """
    Endpoint público para catálogo y cotización de tipos de espacios memoriales.
    Permiso AllowAny (sin requerir inicio de sesión).
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Catálogo Público de Tipos de Espacios e Inmuebles",
        description="Retorna la oferta de tipos de nichos, capacidades y tarifas referenciales para cotización ciudadana.",
        responses={200: OpenApiResponse(description="Catálogo de espacios memoriales")}
    )
    def get(self, request):
        catalogo = [
            {
                'id': 1,
                'tipo': 'Nicho Individual en Pabellón',
                'categoria': 'Pabellón Vertical',
                'capacidad': '1 Difunto',
                'precio_base': 15000.00,
                'cuota_minima_mes': 250.00,
                'plazos_disponibles': [24, 36, 48, 60],
                'descripcion': 'Espacio individual en pabellón vertical de concreto reforzado, con acabado sellado hermético y placa conmemorativa incluida.',
                'caracteristicas': [
                    'Medidas estándar: 2.20m largo x 0.90m ancho x 0.80m alto',
                    'Sellado hermético y placa de granito conmemorativa',
                    'Mantenimiento y jardinería permanente del pabellón',
                    'Derecho de uso y resguardo a perpetuidad'
                ],
                'icono': 'bi-grid-3x3',
                'badge': 'Más Accesible'
            },
            {
                'id': 2,
                'tipo': 'Módulo Familiar (2 a 4 Nichos)',
                'categoria': 'Pabellón Familiar',
                'capacidad': '2 a 4 Espacios',
                'precio_base': 28000.00,
                'cuota_minima_mes': 466.67,
                'plazos_disponibles': [24, 36, 48, 60],
                'descripcion': 'Módulo familiar contiguo para preservar la unión familiar en un sector preferencial con áreas verdes y fácil acceso peatonal.',
                'caracteristicas': [
                    'Disposición modular contigua para la familia',
                    'Placa conmemorativa familiar personalizada',
                    'Financiamiento flexible hasta 60 cuotas mensuales',
                    'Descuento preferencial en servicios de inhumación'
                ],
                'icono': 'bi-people-fill',
                'badge': 'Recomendado'
            },
            {
                'id': 3,
                'tipo': 'Mausoleo Familiar Privado',
                'categoria': 'Mausoleo Exclusivo',
                'capacidad': '6 a 8 Espacios',
                'precio_base': 65000.00,
                'cuota_minima_mes': 1083.33,
                'plazos_disponibles': [24, 36, 48, 60],
                'descripcion': 'Construcción arquitectónica exclusiva con jardines privados, acabados en piedra tallada y acceso independiente.',
                'caracteristicas': [
                    'Estructura privada con jardineras y bancas de descanso',
                    'Capacidad multigeneracional de hasta 8 espacios',
                    'Iluminación solar y mantenimiento preferencial',
                    'Asesoría legal y trámites de escrituración perpetua'
                ],
                'icono': 'bi-bank',
                'badge': 'Exclusivo'
            },
            {
                'id': 4,
                'tipo': 'Cripta / Capilla Conmemorativa',
                'categoria': 'Capilla Solemne',
                'capacidad': 'Espacio Familiar Amplio',
                'precio_base': 95000.00,
                'cuota_minima_mes': 1583.33,
                'plazos_disponibles': [24, 36, 48, 60],
                'descripcion': 'Espacio de alta solemnidad con capilla techada para ceremonias privadas, nichos y osarios con seguridad y recogimiento.',
                'caracteristicas': [
                    'Espacio techado para oración, recogimiento y aniversarios',
                    'Acabados en mármol, piedra natural y vitrales',
                    'Sistema de seguridad y acceso preferencial 24/7',
                    'Planes de pago personalizados y asesoría integral'
                ],
                'icono': 'bi-gem',
                'badge': 'Distinción'
            }
        ]
        return Response(catalogo, status=status.HTTP_200_OK)


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
    queryset = EstructuraFisica.objects.all().select_related('sector', 'tipo_estructura').prefetch_related('espacios__estado', 'espacios__detalle_contrato').order_by('id_estructura')
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
        Genera en lote todos los nichos faltantes de la estructura seleccionada de forma atómica y ultra-rápida.
        """
        estructura = self.get_object()
        estado_disponible, _ = EstadoEspacio.objects.get_or_create(
            nombre_estado='Disponible'
        )

        precio_ind = None
        if estructura.precio_estructura_completa and estructura.capacidad_total_espacios:
            precio_ind = estructura.precio_estructura_completa / estructura.capacidad_total_espacios

        # Obtener en UNA sola consulta todas las coordenadas ya existentes
        existentes = set(
            EspacioFisico.objects.filter(estructura=estructura).values_list('posicion_fila', 'posicion_columna')
        )

        sec_nom = estructura.sector.nomenclatura if estructura.sector_id else "SEC"
        est_cod = estructura.codigo_estructura

        nuevos_espacios = []
        for fila in range(1, estructura.total_filas + 1):
            for col in range(1, estructura.total_columnas + 1):
                if (fila, col) not in existentes:
                    codigo = f"{sec_nom}-{est_cod}-F{fila}-C{col}"
                    nuevos_espacios.append(
                        EspacioFisico(
                            estructura=estructura,
                            estado=estado_disponible,
                            posicion_fila=fila,
                            posicion_columna=col,
                            codigo_unico_espacio=codigo,
                            precio_individual=precio_ind
                        )
                    )

        total_creados = 0
        if nuevos_espacios:
            EspacioFisico.objects.bulk_create(nuevos_espacios, batch_size=500)
            total_creados = len(nuevos_espacios)

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
    queryset = EspacioFisico.objects.all().select_related('estructura__sector', 'estado', 'detalle_contrato').order_by('estructura', 'posicion_fila', 'posicion_columna')
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


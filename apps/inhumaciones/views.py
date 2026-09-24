"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - VISTAS API REST (apps/inhumaciones/views.py)

Este archivo define los `ModelViewSet` para la API REST del Módulo D:
- DifuntoViewSet: Registro biográfico y búsqueda de difuntos.
- RegistroInhumacionViewSet: Carga multipart de documentos digitales (RENAP/MSPAS RF-04),
  control de concurrencia e integración transaccional y acción personalizada de Exhumación/Traslado para liberar espacios de inventario.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Difunto, RegistroInhumacion
from .serializers import DifuntoSerializer, RegistroInhumacionSerializer
from apps.inventario.models import EstadoEspacio
from apps.cuentas.models import Bitacora


# ==============================================================================
# 0. VISTA PÚBLICA DE BÚSQUEDA MEMORIAL (PORTAL PÚBLICO)
# ==============================================================================
class ConsultaPublicaMemorialView(APIView):
    """
    Endpoint público para consulta ciudadana de difuntos y sepelios memoriales.
    Permiso AllowAny (no requiere inicio de sesión).
    Protege la privacidad no exponiendo datos comerciales ni información sensible.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Búsqueda Pública de Registros Memoriales",
        description="Permite al público consultar registros de sepelios y ubicación en camposanto sin requerir autenticación.",
        responses={200: OpenApiResponse(description="Listado de difuntos y su ubicación")}
    )
    def get(self, request):
        q = request.query_params.get('q', '').strip()

        qs = RegistroInhumacion.objects.select_related(
            'difunto',
            'espacio__estructura__sector'
        ).filter(estado_inhumacion__in=['ACTIVA', 'EXHUMADO', 'TRASLADADO'])

        if q:
            qs = qs.filter(
                Q(difunto__nombres__icontains=q) |
                Q(difunto__apellidos__icontains=q) |
                Q(difunto__cui__icontains=q) |
                Q(espacio__codigo_unico_espacio__icontains=q) |
                Q(espacio__estructura__nombre_estructura__icontains=q) |
                Q(espacio__estructura__sector__nombre_sector__icontains=q)
            ).order_by('-fecha_sepelio')[:50]
        else:
            # Mostrar los registros más recientes como muestra inicial
            qs = qs.order_by('-fecha_sepelio')[:12]

        resultados = []
        for reg in qs:
            cui_raw = reg.difunto.cui or ""
            # Enmascaramiento de CUI para proteger privacidad ciudadana
            if len(cui_raw) == 13:
                cui_display = f"{cui_raw[:4]} •••• {cui_raw[-4:]}"
            elif cui_raw:
                cui_display = f"{cui_raw[:2]}••••{cui_raw[-2:]}"
            else:
                cui_display = "Sin CUI"

            sector_nom = reg.espacio.estructura.sector.nombre_sector if reg.espacio.estructura.sector else "Camposanto General"
            estructura_nom = reg.espacio.estructura.nombre_estructura
            codigo_nicho = reg.espacio.codigo_unico_espacio

            resultados.append({
                'id': reg.id,
                'difunto_id': reg.difunto.id,
                'nombre_completo': f"{reg.difunto.nombres} {reg.difunto.apellidos}".strip(),
                'cui': cui_display,
                'fecha_defuncion': reg.difunto.fecha_defuncion.strftime('%d/%m/%Y') if reg.difunto.fecha_defuncion else "No registrada",
                'fecha_sepelio': reg.fecha_sepelio.strftime('%d/%m/%Y %H:%M') if reg.fecha_sepelio else "No registrada",
                'ubicacion': f"{sector_nom} — {estructura_nom} ({codigo_nicho})",
                'sector': sector_nom,
                'estructura': estructura_nom,
                'nicho': codigo_nicho,
                'estado': reg.get_estado_inhumacion_display()
            })

        return Response(resultados, status=status.HTTP_200_OK)


# ==============================================================================
# 1. VIEWSET DE DIFUNTOS
# ==============================================================================
class DifuntoViewSet(viewsets.ModelViewSet):
    """
    CRUD y buscador de personas fallecidas.
    Permite filtrar por nombres, apellidos o CUI.
    """
    queryset = Difunto.objects.all().order_by('-id')
    serializer_class = DifuntoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', None)
        cui = self.request.query_params.get('cui', None)

        if cui:
            qs = qs.filter(cui__icontains=cui)
        if search:
            qs = qs.filter(
                Q(nombres__icontains=search) |
                Q(apellidos__icontains=search) |
                Q(cui__icontains=search) |
                Q(causa_muerte__icontains=search)
            )
        return qs


# ==============================================================================
# 2. VIEWSET DE REGISTROS DE INHUMACIÓN Y EXHUMACIÓN
# ==============================================================================
class RegistroInhumacionViewSet(viewsets.ModelViewSet):
    """
    CRUD de Registros de Inhumación.
    Soporta carga de documentos PDF (RENAP y MSPAS) vía MultiPartParser.
    Incluye acción personalizada para Exhumación/Traslado de difuntos y liberación de nichos.
    """
    queryset = RegistroInhumacion.objects.all().select_related(
        'difunto',
        'espacio__estructura__sector',
        'contrato__cliente',
        'usuario_registro'
    ).order_by('-fecha_sepelio')
    serializer_class = RegistroInhumacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        estado = self.request.query_params.get('estado', None)
        espacio = self.request.query_params.get('espacio', None)
        contrato = self.request.query_params.get('contrato', None)
        search = self.request.query_params.get('search', None)

        if estado:
            qs = qs.filter(estado_inhumacion=estado)
        if espacio:
            qs = qs.filter(espacio_id=espacio)
        if contrato:
            qs = qs.filter(contrato_id=contrato)
        if search:
            qs = qs.filter(
                Q(difunto__nombres__icontains=search) |
                Q(difunto__apellidos__icontains=search) |
                Q(difunto__cui__icontains=search) |
                Q(espacio__codigo_unico_espacio__icontains=search) |
                Q(contrato__numero_contrato__icontains=search)
            )
        return qs

    @extend_schema(
        summary="Procesar Exhumación o Traslado de Difunto",
        description="Cambia el estado de la inhumación a 'EXHUMADO' o 'TRASLADADO' y libera automáticamente el espacio físico a 'Disponible' en el inventario.",
        responses={200: OpenApiResponse(description="Inhumación actualizada y espacio liberado exitosamente")}
    )
    @action(detail=True, methods=['post'], url_path='exhumar')
    @transaction.atomic
    def exhumar(self, request, pk=None):
        """
        POST /api/v1/inhumaciones/registros/{id}/exhumar/
        Libera el nicho en el inventario (cambia estado a 'Disponible') y actualiza la inhumación a EXHUMADO o TRASLADADO.
        """
        registro = self.get_object()

        if registro.estado_inhumacion != 'ACTIVA':
            return Response({
                'detail': f"No se puede exhumar un registro que se encuentra en estado '{registro.estado_inhumacion}'."
            }, status=status.HTTP_400_BAD_REQUEST)

        nuevo_estado = request.data.get('nuevo_estado', 'EXHUMADO')
        if nuevo_estado not in ['EXHUMADO', 'TRASLADADO']:
            return Response({
                'nuevo_estado': "El estado debe ser 'EXHUMADO' o 'TRASLADADO'."
            }, status=status.HTTP_400_BAD_REQUEST)

        nuevas_observaciones = request.data.get('observaciones', None)

        # 1. Actualizar el registro de inhumación
        registro.estado_inhumacion = nuevo_estado
        if nuevas_observaciones:
            obs_actual = registro.observaciones or ""
            registro.observaciones = f"{obs_actual}\n[Exhumación/Traslado]: {nuevas_observaciones}".strip()
        registro.save()

        # 2. Actualizar el espacio físico en el módulo de inventario (regresar a 'Reservado' porque mantiene titularidad de contrato)
        espacio = registro.espacio
        quedan_activas = RegistroInhumacion.objects.filter(espacio=espacio, estado_inhumacion='ACTIVA').exists()
        if not quedan_activas:
            estado_reservado, _ = EstadoEspacio.objects.get_or_create(nombre_estado='Reservado')
            espacio.estado = estado_reservado
            espacio.save(update_fields=['estado'])

        # 3. Registrar auditoría en Bitácora
        usuario = request.user if (request and request.user and not request.user.is_anonymous) else registro.usuario_registro
        Bitacora.objects.create(
            usuario=usuario,
            tabla_afectada='inhumaciones_registro',
            accion='UPDATE',
            registro_id=registro.id,
            datos_anteriores={'estado_inhumacion': 'ACTIVA', 'espacio_estado': 'Ocupado'},
            datos_nuevos={'estado_inhumacion': nuevo_estado, 'espacio_estado': 'Reservado'}
        )

        serializer = self.get_serializer(registro)
        return Response({
            'message': f"Exhumación/Traslado procesado exitosamente. El espacio '{espacio.codigo_unico_espacio}' ha pasado a estado 'Reservado' (mantiene titularidad por contrato).",
            'registro': serializer.data
        }, status=status.HTTP_200_OK)

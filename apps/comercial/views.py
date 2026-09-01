"""
MÓDULO C - GESTIÓN COMERCIAL Y FINANCIERA - VISTAS API REST (apps/comercial/views.py)

Este archivo define los `ModelViewSet` y vistas personalizadas para la gestión comercial:
- ModalidadVentaViewSet
- EstadoContratoViewSet
- ContratoViewSet (incluye @action /estado-cuenta/)
- PlanPagoCuotaViewSet
- ControlMantenimientoViewSet
- ReciboPagoViewSet
- CotizadorView (POST /api/v1/comercial/cotizar/ - RF-01 con exportación a PDF en Quetzales Q00.00)
- AlertasMoraView (GET /api/v1/comercial/alertas-mora/ - RF-06)
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Sum, Q, F
from datetime import date
from dateutil.relativedelta import relativedelta
from drf_spectacular.utils import extend_schema, OpenApiResponse

from decimal import Decimal
from .models import (
    ModalidadVenta,
    EstadoContrato,
    Contrato,
    PlanPagoCuota,
    ControlMantenimiento,
    ReciboPago,
    DetallePagoRecibo
)
from .serializers import (
    ModalidadVentaSerializer,
    EstadoContratoSerializer,
    ContratoSerializer,
    PlanPagoCuotaSerializer,
    ControlMantenimientoSerializer,
    ReciboPagoSerializer,
    CotizacionSimuladorSerializer
)
from .pdf_generator import generar_pdf_cotizacion, generar_pdf_recibo


# ==============================================================================
# 1. VIEWSET DE MODALIDAD DE VENTA
# ==============================================================================
class ModalidadVentaViewSet(viewsets.ModelViewSet):
    """
    CRUD para Modalidades de Venta (Contado, Créditos de 12 a 60 Meses).
    """
    queryset = ModalidadVenta.objects.all().order_by('id_modalidad')
    serializer_class = ModalidadVentaSerializer


# ==============================================================================
# 2. VIEWSET DE ESTADO DE CONTRATO
# ==============================================================================
class EstadoContratoViewSet(viewsets.ModelViewSet):
    """
    CRUD para Estados de Contrato (Solicitado, Activo, Liquidado, Cancelado).
    """
    queryset = EstadoContrato.objects.all().order_by('id_estado_contrato')
    serializer_class = EstadoContratoSerializer


# ==============================================================================
# 3. VIEWSET DE CONTRATO
# ==============================================================================
class ContratoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Contratos Comerciales.
    Permite la creación con generación automática de cuotas y asignación de inmuebles.
    """
    queryset = Contrato.objects.all().select_related(
        'cliente', 'usuario_asesor', 'modalidad', 'estado_contrato'
    ).prefetch_related(
        'detalles_espacio__espacio__estructura__sector',
        'plan_cuotas',
        'control_mantenimientos'
    ).order_by('-id_contrato')
    serializer_class = ContratoSerializer

    @extend_schema(
        summary="Consulta Consolidada de Estado de Cuenta del Contrato",
        description="Retorna el resumen financiero acumulado, saldo pendiente de crédito, amortizaciones y cuotas anuales de mantenimiento.",
        responses={200: OpenApiResponse(description="Resumen de Estado de Cuenta")}
    )
    @action(detail=True, methods=['get'], url_path='estado-cuenta')
    def estado_cuenta(self, request, pk=None):
        """
        GET /api/v1/comercial/contratos/{id}/estado-cuenta/
        Consulta detallada de saldos, cuotas pagadas/pendientes y mantenimientos.
        """
        contrato = self.get_object()

        # Cálculos de Enganche pagado en caja
        pagado_enganche = DetallePagoRecibo.objects.filter(
            recibo__contrato=contrato,
            concepto='ENGANCHE'
        ).aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')

        monto_enganche_efectivo = max(Decimal(str(contrato.monto_enganche or 0)), Decimal(str(pagado_enganche)))

        # Cálculos de amortización de crédito
        total_credito = contrato.monto_financiar
        pagado_credito = DetallePagoRecibo.objects.filter(
            recibo__contrato=contrato,
            concepto='CUOTA_AMORTIZACION'
        ).aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')

        if not contrato.modalidad.aplica_credito:
            pagado_credito = Decimal('0.00')
            saldo_credito_pendiente = Decimal('0.00')
        else:
            saldo_credito_pendiente = max(Decimal('0.00'), Decimal(str(total_credito)) - Decimal(str(pagado_credito)))

        # Detalle de cuotas
        cuotas_totales = contrato.plan_cuotas.count()
        cuotas_pagadas = contrato.plan_cuotas.filter(estado_cuota='PAGADA').count()
        cuotas_pendientes = contrato.plan_cuotas.filter(estado_cuota__in=['PENDIENTE', 'VENCIDA']).count()

        # Cálculos de mantenimiento
        mantenimientos_totales = contrato.control_mantenimientos.count()
        mantenimientos_pendientes = contrato.control_mantenimientos.filter(estado_cobro__in=['PENDIENTE', 'EN_MORA']).count()
        mantenimientos_mora = contrato.control_mantenimientos.filter(estado_cobro='EN_MORA').count()

        # Desglose de espacios adquiridos
        espacios = [
            {
                'id_espacio': d.espacio.id_espacio,
                'codigo_unico_espacio': d.espacio.codigo_unico_espacio,
                'estructura': d.espacio.estructura.nombre_estructura,
                'sector': d.espacio.estructura.sector.nombre_sector,
                'precio_unitario': float(d.precio_venta_unitario)
            }
            for d in contrato.detalles_espacio.all()
        ]

        return Response({
            'contrato_id': contrato.id_contrato,
            'numero_contrato': contrato.numero_contrato,
            'cliente': str(contrato.cliente),
            'modalidad': contrato.modalidad.nombre_modalidad,
            'estado': contrato.estado_contrato.nombre_estado_contrato,
            'resumen_financiero': {
                'monto_total_contrato': float(contrato.monto_total),
                'monto_enganche': float(monto_enganche_efectivo),
                'monto_enganche_pactado': float(contrato.monto_enganche),
                'monto_enganche_pagado': float(pagado_enganche),
                'monto_financiar': float(contrato.monto_financiar),
                'monto_pagado_credito': float(pagado_credito),
                'saldo_credito_pendiente': float(saldo_credito_pendiente),
                'plazo_meses': contrato.plazo_meses,
                'cuotas_totales': cuotas_totales,
                'cuotas_pagadas': cuotas_pagadas,
                'cuotas_pendientes': cuotas_pendientes,
            },
            'resumen_mantenimiento': {
                'mantenimientos_totales': mantenimientos_totales,
                'mantenimientos_pendientes': mantenimientos_pendientes,
                'mantenimientos_en_mora': mantenimientos_mora,
            },
            'espacios_adquiridos': espacios,
            'plan_cuotas': PlanPagoCuotaSerializer(contrato.plan_cuotas.all(), many=True).data,
            'control_mantenimientos': ControlMantenimientoSerializer(contrato.control_mantenimientos.all(), many=True).data,
        }, status=status.HTTP_200_OK)


# ==============================================================================
# 4. VIEWSET DE PLAN DE PAGO DE CUOTAS
# ==============================================================================
class PlanPagoCuotaViewSet(viewsets.ModelViewSet):
    """
    CRUD para consulta y gestión de Cuotas del Plan de Amortización.
    """
    queryset = PlanPagoCuota.objects.all().select_related('contrato').order_by('contrato', 'numero_cuota')
    serializer_class = PlanPagoCuotaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        contrato_id = self.request.query_params.get('contrato', None)
        estado = self.request.query_params.get('estado', None)
        if contrato_id:
            qs = qs.filter(contrato_id=contrato_id)
        if estado:
            qs = qs.filter(estado_cuota=estado)
        return qs


# ==============================================================================
# 5. VIEWSET DE CONTROL DE MANTENIMIENTO
# ==============================================================================
class ControlMantenimientoViewSet(viewsets.ModelViewSet):
    """
    CRUD para consulta y registro de cuotas anuales de mantenimiento.
    """
    queryset = ControlMantenimiento.objects.all().select_related('contrato').order_by('-anio_periodo', 'contrato')
    serializer_class = ControlMantenimientoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        contrato_id = self.request.query_params.get('contrato', None)
        estado = self.request.query_params.get('estado', None)
        if contrato_id:
            qs = qs.filter(contrato_id=contrato_id)
        if estado:
            qs = qs.filter(estado_cobro=estado)
        return qs


# ==============================================================================
# 6. VIEWSET DE RECIBOS DE PAGO (CAJA)
# ==============================================================================
class ReciboPagoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Recibos de Pago de Caja.
    Permite registrar cobros con desglose automático de cuotas o mantenimientos.
    """
    queryset = ReciboPago.objects.all().select_related(
        'contrato', 'usuario_cajero'
    ).prefetch_related('detalles').order_by('-fecha_transaccion')
    serializer_class = ReciboPagoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        contrato_id = self.request.query_params.get('contrato', None)
        if contrato_id:
            qs = qs.filter(contrato_id=contrato_id)
        return qs

    @extend_schema(
        summary="Generar Recibo de Caja en PDF",
        description="Retorna el documento imprimible del recibo de caja en formato PDF.",
        responses={200: OpenApiResponse(description="Archivo PDF del recibo")}
    )
    @action(detail=True, methods=['get'], url_path='pdf')
    def generar_pdf(self, request, pk=None):
        """
        GET /api/v1/comercial/recibos/{id}/pdf/
        Genera el comprobante oficial de caja en PDF.
        """
        recibo = self.get_object()
        pdf_buffer = generar_pdf_recibo(recibo)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="recibo_caja_{recibo.correlativo_recibo}.pdf"'
        return response


# ==============================================================================
# 7. VISTA SIMULADOR DE COTIZACIÓN COMERCIAL (RF-01)
# ==============================================================================
class CotizadorView(APIView):
    """
    POST /api/v1/comercial/cotizar/
    Simulador financiero para proyectar cuotas y enganche.
    Permite exportar a PDF (RF-01) con importes formateados en Quetzales (Q00.00).
    """

    @extend_schema(
        summary="Cotizador Financiero Automático (RF-01)",
        description="Calcula la tabla de amortización a plazos y permite descargar una cotización formal en PDF.",
        request=CotizacionSimuladorSerializer,
        responses={200: OpenApiResponse(description="Tabla de amortización proyectada o PDF descargable")}
    )
    def post(self, request):
        serializer = CotizacionSimuladorSerializer(data=request.data)

        serializer = CotizacionSimuladorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        monto_total = float(data['monto_total'])
        monto_enganche = float(data['monto_enganche'])
        plazo_meses = data['plazo_meses']
        cliente_nombre = data.get('cliente_nombre', 'Cliente Prospección')
        exportar_pdf = data.get('exportar_pdf', False) or request.query_params.get('pdf') == 'true'

        monto_financiar = round(monto_total - monto_enganche, 2)
        monto_cuota_base = round(monto_financiar / plazo_meses, 2) if plazo_meses > 0 else 0

        # Generar proyección de cuotas
        cuotas_detalle = []
        fecha_actual = date.today() + relativedelta(months=1)
        saldo_acumulado = monto_financiar

        for i in range(1, plazo_meses + 1):
            if i == plazo_meses:
                # Ajuste de centavos en última cuota
                monto_c = round(saldo_acumulado, 2)
                saldo_acumulado = 0.0
            else:
                monto_c = monto_cuota_base
                saldo_acumulado = round(saldo_acumulado - monto_c, 2)

            cuotas_detalle.append({
                'numero_cuota': i,
                'fecha_vencimiento': fecha_actual.strftime("%Y-%m-%d"),
                'monto_cuota': monto_c,
                'saldo_restante': max(0.0, saldo_acumulado)
            })
            fecha_actual = fecha_actual + relativedelta(months=1)

        # Si solicitó PDF
        if exportar_pdf:
            pdf_buffer = generar_pdf_cotizacion(
                monto_total=monto_total,
                monto_enganche=monto_enganche,
                monto_financiar=monto_financiar,
                plazo_meses=plazo_meses,
                monto_cuota=monto_cuota_base,
                cuotas_detalle=cuotas_detalle,
                cliente_nombre=cliente_nombre
            )
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="cotizacion_financiera.pdf"'
            return response

        return Response({
            'moneda': 'GTQ (Quetzales - Q)',
            'monto_total': monto_total,
            'monto_enganche': monto_enganche,
            'monto_financiar': monto_financiar,
            'plazo_meses': plazo_meses,
            'monto_cuota_estimada': monto_cuota_base,
            'cuotas': cuotas_detalle
        }, status=status.HTTP_200_OK)


# ==============================================================================
# 8. VISTA DE ALERTAS DE COBRANZA Y MORA (RF-06)
# ==============================================================================
class AlertasMoraView(APIView):
    """
    GET /api/v1/comercial/alertas-mora/
    Identifica de forma automática contratos con cuotas o mantenimientos vencidos.
    Clasifica automáticamente según los días de retraso:
    - Preventivo: 1 a 30 días de retraso
    - Operativo: 31 a 90 días de retraso
    - Extrajudicial: Mayor a 90 días de retraso
    (Requisito RF-06).
    """

    @extend_schema(
        summary="Alertas de Cobranza y Mora (RF-06)",
        description="Identifica contratos con cuotas o mantenimientos vencidos y los clasifica por nivel de riesgo.",
        responses={200: OpenApiResponse(description="Listado clasificado de morosidad")}
    )
    def get(self, request):
        hoy = date.today()

        # 0. Garantizar que todos los contratos (Activos o Liquidados) tengan registro de mantenimiento anual para el año en curso
        contratos_vigentes = Contrato.objects.exclude(estado_contrato__nombre_estado_contrato='Cancelado')
        for cnt in contratos_vigentes:
            ControlMantenimiento.objects.get_or_create(
                contrato=cnt,
                anio_periodo=hoy.year,
                defaults={
                    'monto_mantenimiento': 500.00,
                    'fecha_limite_pago': date(hoy.year, 12, 31),
                    'estado_cobro': 'PENDIENTE'
                }
            )

        # 1. Actualizar de forma atómica cobros de mantenimiento vencidos a EN_MORA
        ControlMantenimiento.objects.filter(
            estado_cobro='PENDIENTE',
            fecha_limite_pago__lt=hoy
        ).update(estado_cobro='EN_MORA')

        # 2. Actualizar cuotas de crédito vencidas
        PlanPagoCuota.objects.filter(
            estado_cuota='PENDIENTE',
            fecha_vencimiento__lt=hoy
        ).update(estado_cuota='VENCIDA')

        # 3. Obtener mantenimientos en mora (incluyendo contratos liquidados)
        mantenimientos_mora = ControlMantenimiento.objects.filter(
            estado_cobro='EN_MORA'
        ).select_related('contrato__cliente', 'contrato__estado_contrato')

        # 4. Obtener cuotas de crédito vencidas
        cuotas_vencidas = PlanPagoCuota.objects.filter(
            estado_cuota='VENCIDA'
        ).select_related('contrato__cliente', 'contrato__estado_contrato')

        alertas_preventivas = []
        alertas_operativas = []
        alertas_extrajudiciales = []

        contratos_procesados = set()

        def clasificar_alerta(contrato, dias_atraso, motivo, monto_vencido):
            key = f"{contrato.id_contrato}_{motivo}"
            if key in contratos_procesados:
                return
            contratos_procesados.add(key)

            item = {
                'contrato_id': contrato.id_contrato,
                'numero_contrato': contrato.numero_contrato,
                'estado_contrato': contrato.estado_contrato.nombre_estado_contrato,
                'cliente_nombre': str(contrato.cliente),
                'cliente_telefono': contrato.cliente.telefono or "N/A",
                'cliente_correo': contrato.cliente.correo or "N/A",
                'motivo_mora': motivo,
                'dias_atraso': dias_atraso,
                'monto_vencido': float(monto_vencido)
            }

            if dias_atraso <= 30:
                item['nivel_riesgo'] = 'PREVENTIVO'
                alertas_preventivas.append(item)
            elif dias_atraso <= 90:
                item['nivel_riesgo'] = 'OPERATIVO'
                alertas_operativas.append(item)
            else:
                item['nivel_riesgo'] = 'EXTRAJUDICIAL'
                alertas_extrajudiciales.append(item)

        # Evaluar mantenimientos en mora (incluso si el contrato está Liquidado)
        for m in mantenimientos_mora:
            dias = (hoy - m.fecha_limite_pago).days
            clasificar_alerta(
                m.contrato,
                dias,
                f"Mantenimiento Anual {m.anio_periodo} Vencido",
                m.monto_mantenimiento
            )

        # Evaluar cuotas vencidas
        for c in cuotas_vencidas:
            dias = (hoy - c.fecha_vencimiento).days
            clasificar_alerta(
                c.contrato,
                dias,
                f"Cuota de Crédito #{c.numero_cuota} Vencida",
                c.monto_cuota
            )

        return Response({
            'fecha_evaluacion': hoy.strftime("%Y-%m-%d"),
            'totales': {
                'total_preventivo': len(alertas_preventivas),
                'total_operativo': len(alertas_operativas),
                'total_extrajudicial': len(alertas_extrajudiciales),
                'total_alertas': len(alertas_preventivas) + len(alertas_operativas) + len(alertas_extrajudiciales)
            },
            'preventivo': alertas_preventivas,
            'operativo': alertas_operativas,
            'extrajudicial': alertas_extrajudiciales
        }, status=status.HTTP_200_OK)

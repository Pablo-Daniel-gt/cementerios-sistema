"""
MÓDULO C - GENERADOR DE REPORTES PDF (apps/comercial/pdf_generator.py)

Genera cotizaciones formales en formato PDF utilizando ReportLab (Requisito RF-01).
Formatos de moneda vectorizados exclusivamente en Quetzales Guatemaltecos (Q00.00).
"""

import io
from datetime import date
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generar_pdf_cotizacion(monto_total, monto_enganche, monto_financiar, plazo_meses, monto_cuota, cuotas_detalle, cliente_nombre="Cliente Prospección"):
    """
    Genera un documento PDF en memoria con el plan de amortización simular (RF-01).
    Retorna un io.BytesIO con los bytes del PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Estilos personalizados
    titulo_style = ParagraphStyle(
        'TituloCotizacion',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E293B'),
        alignment=0
    )

    subtitulo_style = ParagraphStyle(
        'SubTituloCotizacion',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    encabezado_seccion = ParagraphStyle(
        'EncabezadoSeccion',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=5
    )

    texto_normal = ParagraphStyle(
        'TextoNormal',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    texto_bold = ParagraphStyle(
        'TextoBold',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. ENCABEZADO PRINCIPAL
    story.append(Paragraph("CEMENTERIOS PRIVADOS DE HUEHUETENANGO", titulo_style))
    story.append(Paragraph("COTIZACIÓN FORMAL Y PLAN DE AMORTIZACIÓN ESTIMADO", subtitulo_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=12))

    # 2. INFORMACIÓN GENERAL Y RESUMEN FINANCIERO
    fecha_emision = date.today().strftime("%d/%m/%Y")
    info_data = [
        [
            Paragraph("<b>Fecha de Cotización:</b>", texto_normal), Paragraph(fecha_emision, texto_normal),
            Paragraph("<b>Moneda:</b>", texto_normal), Paragraph("Quetzales (Q)", texto_bold)
        ],
        [
            Paragraph("<b>Cliente Prospección:</b>", texto_normal), Paragraph(cliente_nombre, texto_normal),
            Paragraph("<b>Plazo Pactado:</b>", texto_normal), Paragraph(f"{plazo_meses} Meses", texto_bold)
        ],
        [
            Paragraph("<b>Precio de Venta Total:</b>", texto_normal), Paragraph(f"Q{monto_total:,.2f}", texto_bold),
            Paragraph("<b>Monto de Enganche:</b>", texto_normal), Paragraph(f"Q{monto_enganche:,.2f}", texto_bold)
        ],
        [
            Paragraph("<b>Saldo a Financiar:</b>", texto_normal), Paragraph(f"Q{monto_financiar:,.2f}", texto_bold),
            Paragraph("<b>Cuota Mensual Estimada:</b>", texto_normal), Paragraph(f"Q{monto_cuota:,.2f}", texto_bold)
        ]
    ]

    t_info = Table(info_data, colWidths=[130, 140, 130, 140])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # 3. TABLA DE PROYECCIÓN DE CUOTAS
    story.append(Paragraph("Tabla Proyectada de Cuotas Mensuales", encabezado_seccion))

    header_tabla = [
        Paragraph("<b>No. Cuota</b>", texto_bold),
        Paragraph("<b>Fecha Vencimiento</b>", texto_bold),
        Paragraph("<b>Monto Cuota (Q)</b>", texto_bold),
        Paragraph("<b>Saldo Restante (Q)</b>", texto_bold)
    ]

    filas_tabla = [header_tabla]
    for c in cuotas_detalle:
        filas_tabla.append([
            Paragraph(str(c['numero_cuota']), texto_normal),
            Paragraph(str(c['fecha_vencimiento']), texto_normal),
            Paragraph(f"Q{c['monto_cuota']:,.2f}", texto_normal),
            Paragraph(f"Q{c['saldo_restante']:,.2f}", texto_normal)
        ])

    t_cuotas = Table(filas_tabla, colWidths=[80, 160, 150, 150])
    t_cuotas.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_cuotas)

    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Nota importante:</b> Esta cotización representa una simulación informativa financiera subjecta a aprobación y firma de contrato formal.", subtitulo_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


def generar_pdf_recibo(recibo):
    """
    Genera un recibo oficial de caja en formato PDF compacto (Media Carta 8.5 x 5.5 pulg).
    Punto 4: Muestra el monto abonado, el saldo restante y la contabilización de cuotas pagadas.
    """
    from django.db.models import Sum
    from decimal import Decimal
    from apps.comercial.models import DetallePagoRecibo

    buffer = io.BytesIO()
    # Formato Media Carta Horizontal (612 x 396 puntos)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(612, 396),
        rightMargin=24,
        leftMargin=24,
        topMargin=18,
        bottomMargin=18
    )

    styles = getSampleStyleSheet()

    titulo_style = ParagraphStyle(
        'TituloReciboComp',
        parent=styles['Heading1'],
        fontSize=13,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        alignment=0
    )

    subtitulo_style = ParagraphStyle(
        'SubTituloReciboComp',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#475569')
    )

    texto_normal = ParagraphStyle(
        'TextoNormalReciboComp',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#334155')
    )

    texto_bold = ParagraphStyle(
        'TextoBoldReciboComp',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. ENCABEZADO COMPACTO
    story.append(Paragraph("<b>CEMENTERIOS PRIVADOS DE HUEHUETENANGO</b>", titulo_style))
    story.append(Paragraph(f"COMPROBANTE DE CAJA / RECIBO #{recibo.correlativo_recibo}", subtitulo_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#16A34A'), spaceAfter=6))

    # 2. CÁLCULOS DE SALDO RESTANTE Y CONTABILIZACIÓN DE CUOTAS
    contrato = recibo.contrato
    cliente = contrato.cliente
    cliente_str = f"{cliente.nombres} {cliente.apellidos}"
    cajero_str = recibo.usuario_cajero.get_full_name() or recibo.usuario_cajero.username if recibo.usuario_cajero else "Caja General"

    pagado_credito = DetallePagoRecibo.objects.filter(
        recibo__contrato=contrato,
        concepto='CUOTA_AMORTIZACION'
    ).aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')

    if not contrato.modalidad.aplica_credito:
        saldo_restante = Decimal('0.00')
    else:
        saldo_restante = max(Decimal('0.00'), contrato.monto_financiar - Decimal(str(pagado_credito)))

    cuotas_totales = contrato.plan_cuotas.count()
    cuotas_pagadas = contrato.plan_cuotas.filter(estado_cuota='PAGADA').count()
    if cuotas_totales > 0:
        conteo_cuotas_str = f"{cuotas_pagadas} de {cuotas_totales} cuotas pagadas"
    else:
        conteo_cuotas_str = "Venta Contado (0 cuotas)"

    # 3. TABLA DE INFORMACIÓN DEL CLIENTE Y RECIBO
    info_data = [
        [
            Paragraph("<b>Recibo No.:</b>", texto_normal), Paragraph(f"#{recibo.correlativo_recibo}", texto_bold),
            Paragraph("<b>Fecha/Hora:</b>", texto_normal), Paragraph(recibo.fecha_transaccion.strftime("%d/%m/%Y %H:%M"), texto_normal)
        ],
        [
            Paragraph("<b>Cliente Titular:</b>", texto_normal), Paragraph(cliente_str, texto_normal),
            Paragraph("<b>Contrato No.:</b>", texto_normal), Paragraph(contrato.numero_contrato, texto_bold)
        ],
        [
            Paragraph("<b>Método de Pago:</b>", texto_normal), Paragraph(recibo.get_metodo_pago_display(), texto_normal),
            Paragraph("<b>No. Boleta/Ref.:</b>", texto_normal), Paragraph(recibo.numero_boleta_banco or "N/A", texto_normal)
        ]
    ]

    t_info = Table(info_data, colWidths=[90, 190, 90, 194])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 6))

    # 4. TABLA DE DESGLOSE FINANCIERO COMPACTA (RESUMIDA SIN LISTAR CUOTAS INDIVIDUALES)
    header_tabla = [
        Paragraph("<b>Concepto de Cobro</b>", texto_bold),
        Paragraph("<b>Monto Abonado (Q)</b>", texto_bold)
    ]

    filas_tabla = [header_tabla]
    detalles = recibo.detalles.all()

    # 4a. Agrupar cuotas de crédito en 1 sola fila resumida (Punto 1: contabilizar sin enlistar)
    detalles_credito = detalles.filter(concepto='CUOTA_AMORTIZACION')
    if detalles_credito.exists():
        monto_credito = detalles_credito.aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')
        cuotas_canceladas_recibo = detalles_credito.filter(plan_cuota__isnull=False).count()

        if cuotas_canceladas_recibo > 0:
            desc_credito = f"Cuota de Amortización Crédito ({cuotas_canceladas_recibo} cuota(s) cancelada(s) con este pago)"
        else:
            desc_credito = "Cuota de Amortización Crédito (Abono a cuota)"

        filas_tabla.append([
            Paragraph(desc_credito, texto_normal),
            Paragraph(f"Q{monto_credito:,.2f}", texto_bold)
        ])

    # 4b. Agrupar enganche
    detalles_enganche = detalles.filter(concepto='ENGANCHE')
    if detalles_enganche.exists():
        monto_eng = detalles_enganche.aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')
        filas_tabla.append([
            Paragraph("Enganche Inicial del Contrato", texto_normal),
            Paragraph(f"Q{monto_eng:,.2f}", texto_bold)
        ])

    # 4c. Agrupar mantenimiento
    detalles_mante = detalles.filter(concepto='MANTENIMIENTO_ANUAL')
    if detalles_mante.exists():
        monto_mante = detalles_mante.aggregate(Sum('monto_aplicado'))['monto_aplicado__sum'] or Decimal('0.00')
        mantes_periodos = [str(d.control_mantenimiento.anio_periodo) for d in detalles_mante if d.control_mantenimiento]
        periodo_str = f" (Año {', '.join(mantes_periodos)})" if mantes_periodos else ""
        filas_tabla.append([
            Paragraph(f"Mantenimiento Anual Camposanto{periodo_str}", texto_normal),
            Paragraph(f"Q{monto_mante:,.2f}", texto_bold)
        ])

    # Fallback si no hubo desgloses específicos
    if len(filas_tabla) == 1:
        filas_tabla.append([
            Paragraph("Cobro Abonado al Contrato", texto_normal),
            Paragraph(f"Q{recibo.monto_ingresado:,.2f}", texto_bold)
        ])

    t_detalles = Table(filas_tabla, colWidths=[384, 180])
    t_detalles.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16A34A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_detalles)
    story.append(Spacer(1, 6))

    # 5. RESUMEN DE SALDO RESTANTE Y CONTEO DE CUOTAS
    resumen_data = [
        [
            Paragraph("<b>Monto Abonado en este Recibo:</b>", texto_normal),
            Paragraph(f"<b>Q{recibo.monto_ingresado:,.2f}</b>", texto_bold),
            Paragraph("<b>Cuotas Pagadas a la Fecha:</b>", texto_normal),
            Paragraph(f"<b>{conteo_cuotas_str}</b>", texto_bold)
        ],
        [
            Paragraph("<b>Saldo Restante de Crédito:</b>", texto_normal),
            Paragraph(f"<b>Q{saldo_restante:,.2f}</b>", texto_bold),
            Paragraph("<b>Cajero Receptor:</b>", texto_normal),
            Paragraph(cajero_str, texto_normal)
        ]
    ]

    t_resumen = Table(resumen_data, colWidths=[150, 130, 150, 134])
    t_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#BFDBFE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DBEAFE')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_resumen)

    if recibo.observaciones:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Observaciones:</b> {recibo.observaciones}", texto_normal))

    story.append(Spacer(1, 15))

    # 6. FIRMAS DE CONFORMIDAD COMPACTAS
    firmas_data = [
        [Paragraph("_______________________________<br/>Firma Cajero Autorizado", texto_normal),
         Paragraph("_______________________________<br/>Firma Cliente de Conformidad", texto_normal)]
    ]
    t_firmas = Table(firmas_data, colWidths=[282, 282])
    t_firmas.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_firmas)

    doc.build(story)
    buffer.seek(0)
    return buffer

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
    Genera un recibo oficial de caja en formato PDF (imprimible).
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

    titulo_style = ParagraphStyle(
        'TituloRecibo',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        alignment=0
    )

    subtitulo_style = ParagraphStyle(
        'SubTituloRecibo',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )

    texto_normal = ParagraphStyle(
        'TextoNormalRecibo',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    texto_bold = ParagraphStyle(
        'TextoBoldRecibo',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. ENCABEZADO
    story.append(Paragraph("<b>CEMENTERIOS PRIVADOS DE HUEHUETENANGO</b>", titulo_style))
    story.append(Paragraph(f"COMPROBANTE OFICIAL DE CAJA / RECIBO #{recibo.correlativo_recibo}", subtitulo_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#16A34A'), spaceAfter=12))

    # 2. INFORMACIÓN GENERAL DEL RECIBO
    cliente = recibo.contrato.cliente
    cliente_str = f"{cliente.nombres} {cliente.apellidos} (DPI: {cliente.cui})"
    cajero_str = recibo.usuario_cajero.get_full_name() or recibo.usuario_cajero.username if recibo.usuario_cajero else "Caja General"

    info_data = [
        [
            Paragraph("<b>Recibo No.:</b>", texto_normal), Paragraph(f"#{recibo.correlativo_recibo}", texto_bold),
            Paragraph("<b>Fecha / Hora:</b>", texto_normal), Paragraph(recibo.fecha_transaccion.strftime("%d/%m/%Y %H:%M"), texto_normal)
        ],
        [
            Paragraph("<b>Cliente Titular:</b>", texto_normal), Paragraph(cliente_str, texto_normal),
            Paragraph("<b>Contrato No.:</b>", texto_normal), Paragraph(recibo.contrato.numero_contrato, texto_bold)
        ],
        [
            Paragraph("<b>Método de Pago:</b>", texto_normal), Paragraph(recibo.get_metodo_pago_display(), texto_normal),
            Paragraph("<b>No. Boleta / Ref.:</b>", texto_normal), Paragraph(recibo.numero_boleta_banco or "N/A", texto_normal)
        ],
        [
            Paragraph("<b>Cajero Receptor:</b>", texto_normal), Paragraph(cajero_str, texto_normal),
            Paragraph("<b>Monto Total:</b>", texto_normal), Paragraph(f"Q{recibo.monto_ingresado:,.2f}", texto_bold)
        ]
    ]

    t_info = Table(info_data, colWidths=[110, 160, 110, 160])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # 3. DESGLOSE DE CONCEPTOS SALDADOS
    story.append(Paragraph("<b>DESGLOSE DE CONCEPTOS APLICADOS:</b>", texto_bold))
    story.append(Spacer(1, 6))

    header_tabla = [
        Paragraph("<b>Concepto</b>", texto_bold),
        Paragraph("<b>Referencia / Detalle</b>", texto_bold),
        Paragraph("<b>Monto Aplicado (Q)</b>", texto_bold)
    ]

    filas_tabla = [header_tabla]
    detalles = recibo.detalles.all()
    for d in detalles:
        ref_str = "Pago General / Enganche"
        if d.plan_cuota:
            ref_str = f"Cuota No. {d.plan_cuota.numero_cuota} (Venc: {d.plan_cuota.fecha_vencimiento})"
        elif d.control_mantenimiento:
            ref_str = f"Mantenimiento Año {d.control_mantenimiento.anio_periodo}"

        filas_tabla.append([
            Paragraph(d.get_concepto_display(), texto_normal),
            Paragraph(ref_str, texto_normal),
            Paragraph(f"Q{d.monto_aplicado:,.2f}", texto_normal)
        ])

    t_detalles = Table(filas_tabla, colWidths=[160, 240, 140])
    t_detalles.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16A34A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_detalles)

    if recibo.observaciones:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Observaciones:</b> {recibo.observaciones}", texto_normal))

    story.append(Spacer(1, 40))

    # Firmas
    firmas_data = [
        [Paragraph("_______________________________<br/>Firma Cajero Autorizado", texto_normal),
         Paragraph("_______________________________<br/>Firma Cliente de Conformidad", texto_normal)]
    ]
    t_firmas = Table(firmas_data, colWidths=[270, 270])
    t_firmas.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_firmas)

    doc.build(story)
    buffer.seek(0)
    return buffer

"""
MÓDULO C - GENERADOR DE REPORTES PDF (apps/comercial/pdf_generator.py)

Genera cotizaciones formales en formato PDF utilizando ReportLab (Requisito RF-01).
Formatos de moneda vectorizados exclusivamente en Quetzales Guatemaltecos (Q00.00).
"""

import io
from datetime import date
from reportlab.lib.pagesizes import letter, landscape
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


def generar_pdf_reporte_morosos(datos_morosos, fecha_evaluacion=None):
    """
    Genera un informe formal en PDF de los clientes en estado de morosidad (> 31 días de atraso).
    Excluye cartera preventiva (1 a 30 días) para enfocar las gestiones de cobranza operativa y legal.
    Retorna un io.BytesIO con el archivo PDF en orientación horizontal (landscape).
    """
    if not fecha_evaluacion:
        fecha_evaluacion = date.today().strftime("%d/%m/%Y")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    titulo_style = ParagraphStyle(
        'TituloReporteMorosos',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    subtitulo_style = ParagraphStyle(
        'SubTituloReporteMorosos',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748B')
    )

    badge_alerta = ParagraphStyle(
        'BadgeAlerta',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#991B1B'),
        fontName='Helvetica-Bold'
    )

    texto_th = ParagraphStyle(
        'TextoTH',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        alignment=1
    )

    texto_td = ParagraphStyle(
        'TextoTD',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    texto_td_center = ParagraphStyle(
        'TextoTDCenter',
        parent=texto_td,
        alignment=1
    )

    texto_td_right = ParagraphStyle(
        'TextoTDRight',
        parent=texto_td,
        alignment=2,
        fontName='Helvetica-Bold'
    )

    texto_operativo = ParagraphStyle(
        'TextoOperativo',
        parent=texto_td_center,
        textColor=colors.HexColor('#B45309'),
        fontName='Helvetica-Bold'
    )

    texto_extrajudicial = ParagraphStyle(
        'TextoExtrajudicial',
        parent=texto_td_center,
        textColor=colors.HexColor('#DC2626'),
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL
    encabezado_data = [
        [
            Paragraph("<b>CAMPOSANTO MEMORIAL — DEPARTAMENTO DE CRÉDITO Y COBRANZAS</b><br/>"
                      "<b>INFORME OFICIAL DE CLIENTES EN ESTADO DE MOROSIDAD (> 31 DÍAS)</b><br/>"
                      "<font size=8 color='#64748B'>Gestión de Cobranza Cartera Operativa (31-90 días) y Extrajudicial (>90 días)</font>", titulo_style),
            Paragraph(f"<b>Fecha de Emisión:</b> {fecha_evaluacion}<br/>"
                      f"<b>Criterio:</b> Atraso &gt; 31 Días<br/>"
                      f"<b>Documento:</b> Confidencial / Cobranza", subtitulo_style)
        ]
    ]
    t_enc = Table(encabezado_data, colWidths=[520, 200])
    t_enc.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_enc)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#DC2626'), spaceBefore=2, spaceAfter=10))

    # 2. CÁLCULO DE TOTALES Y MÉTRICAS
    total_casos = len(datos_morosos)
    clientes_unicos = len(set(d.get('cliente_nombre') for d in datos_morosos))
    total_monto = sum(float(d.get('monto_vencido', 0)) for d in datos_morosos)
    total_operativo = sum(1 for d in datos_morosos if 31 <= d.get('dias_atraso', 0) <= 90)
    total_extrajudicial = sum(1 for d in datos_morosos if d.get('dias_atraso', 0) > 90)

    # 3. TABLA RESUMEN / KPIS
    resumen_data = [
        [
            Paragraph("<b>Total Clientes en Mora:</b>", subtitulo_style),
            Paragraph(f"<b>{clientes_unicos}</b>", texto_td),
            Paragraph("<b>Casos Registrados:</b>", subtitulo_style),
            Paragraph(f"<b>{total_casos}</b>", texto_td),
            Paragraph("<b>Cobranza Operativa (31-90 d):</b>", subtitulo_style),
            Paragraph(f"<b>{total_operativo}</b>", texto_operativo),
            Paragraph("<b>Extrajudicial (>90 d):</b>", subtitulo_style),
            Paragraph(f"<b>{total_extrajudicial}</b>", texto_extrajudicial),
            Paragraph("<b>Deuda Total Vencida:</b>", subtitulo_style),
            Paragraph(f"<b>Q{total_monto:,.2f}</b>", texto_td_right)
        ]
    ]
    t_res = Table(resumen_data, colWidths=[105, 35, 90, 35, 120, 35, 95, 35, 95, 75])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FCA5A5')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#FECACA')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 10))

    # 4. TABLA DETALLADA DE MOROSIDAD
    if total_casos == 0:
        vacio_data = [
            [Paragraph("<b>No se encontraron clientes con mora superior a 31 días a la fecha.</b> Toda la cartera comercial se encuentra al día o en plazo preventivo.", texto_td_center)]
        ]
        t_vacio = Table(vacio_data, colWidths=[720])
        t_vacio.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#86EFAC')),
            ('PADDING', (0, 0), (-1, -1), 15),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(t_vacio)
    else:
        filas_tabla = [
            [
                Paragraph("<b>Cliente / Titular</b>", texto_th),
                Paragraph("<b>Teléfono / Contacto</b>", texto_th),
                Paragraph("<b>Contrato</b>", texto_th),
                Paragraph("<b>Concepto de Deuda Vencida</b>", texto_th),
                Paragraph("<b>Días Atraso</b>", texto_th),
                Paragraph("<b>Monto Vencido</b>", texto_th),
                Paragraph("<b>Nivel Gestión</b>", texto_th),
            ]
        ]

        # Ordenar por días de atraso descendente
        datos_ordenados = sorted(datos_morosos, key=lambda x: x.get('dias_atraso', 0), reverse=True)

        for d in datos_ordenados:
            dias = d.get('dias_atraso', 0)
            monto = float(d.get('monto_vencido', 0))
            es_extra = dias > 90
            est_nivel = texto_extrajudicial if es_extra else texto_operativo
            txt_nivel = "EXTRAJUDICIAL" if es_extra else "OPERATIVO"

            filas_tabla.append([
                Paragraph(f"<b>{d.get('cliente_nombre', 'N/A')}</b>", texto_td),
                Paragraph(str(d.get('cliente_telefono', 'N/A')), texto_td_center),
                Paragraph(str(d.get('numero_contrato', 'N/A')), texto_td_center),
                Paragraph(str(d.get('motivo_mora', 'N/A')), texto_td),
                Paragraph(f"<b>{dias} d</b>", texto_td_center),
                Paragraph(f"Q{monto:,.2f}", texto_td_right),
                Paragraph(txt_nivel, est_nivel),
            ])

        t_detalles = Table(filas_tabla, colWidths=[150, 90, 80, 170, 60, 85, 85])
        t_detalles.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991B1B')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_detalles)

    story.append(Spacer(1, 18))

    # 5. FIRMAS DE RESPONSABILIDAD
    firmas_data = [
        [
            Paragraph("________________________________________<br/><b>Lic. Encargado de Crédito y Cobranza</b><br/>Gestión y Seguimiento Telefónico / Domiciliar", texto_td_center),
            Paragraph("________________________________________<br/><b>Gerencia General / Dirección Administrativa</b><br/>Autorización de Expedientes para Cobro", texto_td_center)
        ]
    ]
    t_firmas = Table(firmas_data, colWidths=[360, 360])
    t_firmas.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_firmas)

    doc.build(story)
    buffer.seek(0)
    return buffer

"""
MÓDULO C - PRUEBAS UNITARIAS Y DE INTEGRACIÓN (apps/comercial/tests.py)

Evalúa la lógica de negocio y endpoints de la API Comercial:
1. Cotizador financiero simulador (RF-01) en JSON y PDF.
2. Creación de contratos a crédito con autogeneración de cuotas (RF-01).
3. Recibos de caja y actualización de estados de cuota.
4. Alertas de cobranza y mora (RF-06).
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date

from apps.cuentas.models import Rol, Usuario, Cliente
from apps.inventario.models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico
from apps.comercial.models import ModalidadVenta, EstadoContrato, Contrato, PlanPagoCuota, ControlMantenimiento, ReciboPago


class ComercialBackendTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear Rol y Usuario de prueba
        self.rol_admin = Rol.objects.create(nombre="Administrador", descripcion="Acceso Total")
        self.user = Usuario.objects.create_user(
            username="asesor_comercial",
            email="asesor@cementerio.com",
            password="password123",
            rol=self.rol_admin
        )
        self.client.force_authenticate(user=self.user)

        # 2. Crear Cliente de prueba
        self.cliente = Cliente.objects.create(
            cui="1234567890101",
            nombres="Juan Carlos",
            apellidos="Pérez Gómez",
            telefono="55554444",
            correo="juan@gmail.com"
        )

        # 3. Crear Modalidades y Estados
        self.modalidad_contado = ModalidadVenta.objects.create(
            nombre_modalidad="Contado",
            aplica_credito=False
        )
        self.modalidad_credito24 = ModalidadVenta.objects.create(
            nombre_modalidad="Crédito 24 Meses",
            aplica_credito=True
        )

        self.estado_activo = EstadoContrato.objects.create(nombre_estado_contrato="Activo")
        self.estado_solicitado = EstadoContrato.objects.create(nombre_estado_contrato="Solicitado")

        # 4. Crear Datos de Inventario (Sector, Estructura y Espacio Físico)
        self.sector = Sector.objects.create(nombre_sector="Sector A", nomenclatura="SEC-A")
        self.tipo_pabellon = TipoEstructura.objects.create(nombre_tipo="Pabellón")
        self.estado_disponible = EstadoEspacio.objects.create(nombre_estado="Disponible")

        self.estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo_pabellon,
            nombre_estructura="Pabellón San Pedro",
            codigo_estructura="PAB-SP",
            total_filas=2,
            total_columnas=2
        )

        self.espacio1 = EspacioFisico.objects.create(
            estructura=self.estructura,
            estado=self.estado_disponible,
            posicion_fila=1,
            posicion_columna=1,
            precio_individual=12000.00
        )
        self.espacio2 = EspacioFisico.objects.create(
            estructura=self.estructura,
            estado=self.estado_disponible,
            posicion_fila=1,
            posicion_columna=2,
            precio_individual=12000.00
        )

    def test_simulador_cotizacion_json(self):
        """Prueba el endpoint del cotizador simulador (RF-01) retornando JSON."""
        url = reverse('cotizador-simulador')
        payload = {
            "monto_total": 24000.00,
            "monto_enganche": 4000.00,
            "plazo_meses": 24,
            "cliente_nombre": "Juan Carlos Pérez"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['monto_financiar'], 20000.00)
        self.assertEqual(len(response.data['cuotas']), 24)

    def test_simulador_cotizacion_pdf(self):
        """Prueba la exportación de cotización en formato PDF con formato en Quetzales."""
        url = reverse('cotizador-simulador')
        payload = {
            "monto_total": 24000.00,
            "monto_enganche": 4000.00,
            "plazo_meses": 12,
            "exportar_pdf": True
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')

    def test_creacion_contrato_credito_y_plan_cuotas(self):
        """Prueba la creación de contrato a crédito y autogeneración de cuotas (RF-01)."""
        url = reverse('contrato-list')
        payload = {
            "numero_contrato": "CNT-TEST-001",
            "cliente": self.cliente.id,
            "modalidad": self.modalidad_credito24.id_modalidad,
            "estado_contrato": self.estado_activo.id_estado_contrato,
            "monto_total": 24000.00,
            "monto_enganche": 4000.00,
            "plazo_meses": 24,
            "fecha_firma": str(date.today()),
            "fecha_inicio_pago": str(date.today()),
            "espacios_ids": [self.espacio1.id_espacio],
            "estructura_id": None
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        contrato_id = response.data['id_contrato']
        contrato = Contrato.objects.get(pk=contrato_id)
        self.assertEqual(contrato.monto_financiar, 20000.00)
        self.assertEqual(contrato.plan_cuotas.count(), 24)

        # Verificar que el espacio cambió a Reservado
        self.espacio1.refresh_from_db()
        self.assertEqual(self.espacio1.estado.nombre_estado, "Reservado")

    def test_alertas_mora(self):
        """Prueba la evaluación automática de mora y cobranza (RF-06)."""
        # Crear contrato con fecha limite pasada
        contrato = Contrato.objects.create(
            numero_contrato="CNT-MORA-001",
            cliente=self.cliente,
            usuario_asesor=self.user,
            modalidad=self.modalidad_credito24,
            estado_contrato=self.estado_activo,
            monto_total=12000.00,
            monto_enganche=2000.00,
            monto_financiar=10000.00,
            plazo_meses=10,
            fecha_firma=date(2025, 1, 1),
            fecha_inicio_pago=date(2025, 2, 1)
        )

        # Crear mantenimiento vencido
        ControlMantenimiento.objects.create(
            contrato=contrato,
            anio_periodo=2025,
            monto_mantenimiento=500.00,
            fecha_limite_pago=date(2025, 6, 30),
            estado_cobro='PENDIENTE'
        )

        url = reverse('alertas-mora')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['totales']['total_alertas'], 1)

    def test_pago_multicuota_cascada_y_generacion_pdf(self):
        """Prueba la asignación en cascada de pagos multicuota y la exportación de recibo en PDF."""
        # 1. Crear contrato
        contrato = Contrato.objects.create(
            numero_contrato="CNT-CASCADA-001",
            cliente=self.cliente,
            usuario_asesor=self.user,
            modalidad=self.modalidad_credito24,
            estado_contrato=self.estado_activo,
            monto_total=12000.00,
            monto_enganche=2000.00,
            monto_financiar=10000.00,
            plazo_meses=2,
            fecha_firma=date(2026, 1, 1),
            fecha_inicio_pago=date(2026, 2, 1)
        )
        contrato.generar_plan_amortizacion()
        self.assertEqual(contrato.plan_cuotas.count(), 2)

        # 2. Registrar recibo de pago que cubre ambas cuotas (Q10,000)
        url_recibo = reverse('recibo-pago-list')
        payload = {
            "contrato": contrato.id_contrato,
            "monto_ingresado": 10000.00,
            "metodo_pago": "EFECTIVO",
            "detalles": [
                {
                    "concepto": "CUOTA_AMORTIZACION",
                    "monto_aplicado": 10000.00
                }
            ]
        }
        resp = self.client.post(url_recibo, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        recibo_id = resp.data['id_recibo']

        # Verificar que ambas cuotas fueron marcadas como PAGADA
        self.assertEqual(contrato.plan_cuotas.filter(estado_cuota='PAGADA').count(), 2)

        # 3. Probar descarga de recibo en PDF
        url_pdf = reverse('recibo-pago-generar-pdf', kwargs={'pk': recibo_id})
        resp_pdf = self.client.get(url_pdf)
        self.assertEqual(resp_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_pdf['Content-Type'], 'application/pdf')

    def test_edicion_monto_recibo(self):
        """Valida la edicin del monto ingresado en un recibo y el recalculado de amortizaciones."""
        contrato = Contrato.objects.create(
            numero_contrato="CNT-EDIT-001",
            cliente=self.cliente,
            usuario_asesor=self.user,
            modalidad=self.modalidad_credito24,
            estado_contrato=self.estado_activo,
            monto_total=12000.00,
            monto_enganche=2000.00,
            monto_financiar=10000.00,
            plazo_meses=2,
            fecha_firma=date(2026, 1, 1),
            fecha_inicio_pago=date(2026, 2, 1)
        )
        contrato.generar_plan_amortizacion()

        url_recibo = reverse('recibo-pago-list')
        resp = self.client.post(url_recibo, {
            "contrato": contrato.id_contrato,
            "monto_ingresado": 10000.00,
            "metodo_pago": "EFECTIVO"
        }, format='json')
        recibo_id = resp.data['id_recibo']
        self.assertEqual(contrato.plan_cuotas.filter(estado_cuota='PAGADA').count(), 2)

        # Editar recibo reduciendo el monto a Q5000 (solo 1 cuota debe quedar PAGADA)
        url_detail = reverse('recibo-pago-detail', kwargs={'pk': recibo_id})
        resp_edit = self.client.patch(url_detail, {
            "monto_ingresado": 5000.00,
            "observaciones": "Ajuste de error por el cajero"
        }, format='json')
        self.assertEqual(resp_edit.status_code, status.HTTP_200_OK)
        self.assertEqual(contrato.plan_cuotas.filter(estado_cuota='PAGADA').count(), 1)

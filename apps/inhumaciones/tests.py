"""
MÓDULO D - REGISTRO OPERATIVO DE INHUMACIONES Y EXHUMACIONES - PRUEBAS UNITARIAS Y DE INTEGRACIÓN (apps/inhumaciones/tests.py)

Evalúa la lógica de negocio, reglas de dominio y endpoints de la API de Inhumaciones:
1. Registro biográfico de Difunto y validación de CUI/Fechas.
2. Formulario de Inhumación (RF-04) con anexos digitales en PDF (RENAP / MSPAS).
3. Verificación de Solvencia Comercial (RF-05) y pertenencia de espacio a contrato.
4. Capacidad Atómica y Control de Concurrencia (RNF-02) - Ocupación de Nicho.
5. Acción de Exhumación/Traslado y liberación automática del nicho a 'Disponible'.
6. Auditoría en Bitácora (RNF-08).
"""

from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, datetime
from django.utils import timezone

from apps.cuentas.models import Rol, Usuario, Cliente, Bitacora
from apps.inventario.models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico
from apps.comercial.models import ModalidadVenta, EstadoContrato, Contrato, DetalleContratoEspacio, ControlMantenimiento
from apps.inhumaciones.models import Difunto, RegistroInhumacion


class InhumacionesBackendTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear Rol y Usuario Operador
        self.rol_admin = Rol.objects.create(nombre="Administrador", descripcion="Acceso Total")
        self.user = Usuario.objects.create_user(
            username="operador_camposanto",
            email="operador@cementerio.com",
            password="password123",
            rol=self.rol_admin
        )
        self.client.force_authenticate(user=self.user)

        # 2. Crear Cliente y Contrato Comercial
        self.cliente = Cliente.objects.create(
            cui="1234567890101",
            nombres="María Mercedes",
            apellidos="López Castillo",
            telefono="77665544",
            correo="maria@gmail.com"
        )

        self.modalidad_contado = ModalidadVenta.objects.create(
            nombre_modalidad="Contado",
            aplica_credito=False
        )
        self.estado_activo = EstadoContrato.objects.create(nombre_estado_contrato="Activo")
        self.estado_solicitado = EstadoContrato.objects.create(nombre_estado_contrato="Solicitado")

        self.contrato_activo = Contrato.objects.create(
            numero_contrato="CNT-2026-0001",
            cliente=self.cliente,
            usuario_asesor=self.user,
            modalidad=self.modalidad_contado,
            estado_contrato=self.estado_activo,
            monto_total=15000.00,
            monto_enganche=15000.00,
            monto_financiar=0.00,
            plazo_meses=0,
            fecha_firma=date(2026, 1, 1),
            fecha_inicio_pago=date(2026, 1, 1)
        )

        # 3. Crear Inventario Físico
        self.sector = Sector.objects.create(nombre_sector="Sector San Juan", nomenclatura="SEC-SJ")
        self.tipo_pabellon = TipoEstructura.objects.create(nombre_tipo="Pabellón")
        self.estado_disponible = EstadoEspacio.objects.create(nombre_estado="Disponible")
        self.estado_ocupado = EstadoEspacio.objects.create(nombre_estado="Ocupado")
        self.estado_reservado = EstadoEspacio.objects.create(nombre_estado="Reservado")

        self.estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo_pabellon,
            nombre_estructura="Pabellón San Juan 01",
            codigo_estructura="PAB-SJ1",
            total_filas=2,
            total_columnas=2
        )

        self.espacio1 = EspacioFisico.objects.create(
            estructura=self.estructura,
            estado=self.estado_reservado,
            posicion_fila=1,
            posicion_columna=1,
            precio_individual=15000.00
        )

        # Vincular espacio a contrato
        DetalleContratoEspacio.objects.create(
            contrato=self.contrato_activo,
            espacio=self.espacio1,
            precio_venta_unitario=15000.00
        )

        # 4. Crear Difunto de Prueba
        self.difunto = Difunto.objects.create(
            cui="9876543210123",
            nombres="Roberto Carlos",
            apellidos="García Morales",
            fecha_nacimiento=date(1950, 5, 20),
            fecha_defuncion=date(2026, 8, 30),
            causa_muerte="Paro Cardiorrespiratorio",
            lugar_defuncion="Hospital Nacional de Huehuetenango"
        )

        # Archivo PDF falso simulado
        self.fake_pdf_renap = SimpleUploadedFile(
            "acta_renap_test.pdf",
            b"%PDF-1.4 Fake PDF Content for RENAP",
            content_type="application/pdf"
        )
        self.fake_pdf_mspas = SimpleUploadedFile(
            "certificado_mspas_test.pdf",
            b"%PDF-1.4 Fake PDF Content for MSPAS",
            content_type="application/pdf"
        )

    def test_creacion_difunto_api(self):
        """Prueba la creación de difuntos biográficos a través de la API REST."""
        url = reverse('difunto-list')
        payload = {
            "cui": "1122334455667",
            "nombres": "Ana Lucía",
            "apellidos": "Mendoza Cruz",
            "fecha_nacimiento": "1985-11-10",
            "fecha_defuncion": "2026-08-28",
            "causa_muerte": "Causas Naturales",
            "lugar_defuncion": "Domicilio Particular"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Difunto.objects.count(), 2)

    def test_registro_inhumacion_exitosa_y_cambio_estado_nicho(self):
        """Prueba el registro operativo de inhumación (RF-04) y el cambio de estado del nicho a 'Ocupado'."""
        url = reverse('registro-inhumacion-list')
        payload = {
            "difunto": self.difunto.id,
            "espacio": self.espacio1.id_espacio,
            "contrato": self.contrato_activo.id_contrato,
            "fecha_sepelio": "2026-09-01T10:00:00Z",
            "acta_renap_pdf": self.fake_pdf_renap,
            "certificado_mspas_pdf": self.fake_pdf_mspas,
            "observaciones": "Inhumación procesada sin novedades."
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que el registro se creó
        self.assertEqual(RegistroInhumacion.objects.count(), 1)
        registro = RegistroInhumacion.objects.first()
        self.assertEqual(registro.estado_inhumacion, 'ACTIVA')

        # Verificar que el espacio cambió su estado a 'Ocupado'
        self.espacio1.refresh_from_db()
        self.assertEqual(self.espacio1.estado.nombre_estado, "Ocupado")

        # Verificar auditoría en bitácora (RNF-08)
        self.assertTrue(Bitacora.objects.filter(tabla_afectada='inhumaciones_registro', accion='INSERT').exists())

    def test_validacion_solvencia_mora_contrato(self):
        """RF-05: Rechazo de inhumación si el contrato presenta morosidad imprevista."""
        # Crear un control de mantenimiento en MORA
        ControlMantenimiento.objects.create(
            contrato=self.contrato_activo,
            anio_periodo=2025,
            monto_mantenimiento=500.00,
            fecha_limite_pago=date(2025, 12, 31),
            estado_cobro='EN_MORA'
        )

        url = reverse('registro-inhumacion-list')
        payload = {
            "difunto": self.difunto.id,
            "espacio": self.espacio1.id_espacio,
            "contrato": self.contrato_activo.id_contrato,
            "fecha_sepelio": "2026-09-01T10:00:00Z",
            "acta_renap_pdf": self.fake_pdf_renap
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("MORA", str(response.data))

    def test_validacion_espacio_no_pertenece_a_contrato(self):
        """RF-05: Rechazo de inhumación si el espacio físico no pertenece a las propiedades del contrato."""
        # Crear otro espacio sin vincular al contrato
        espacio_ajeno = EspacioFisico.objects.create(
            estructura=self.estructura,
            estado=self.estado_disponible,
            posicion_fila=1,
            posicion_columna=2
        )

        url = reverse('registro-inhumacion-list')
        payload = {
            "difunto": self.difunto.id,
            "espacio": espacio_ajeno.id_espacio,
            "contrato": self.contrato_activo.id_contrato,
            "fecha_sepelio": "2026-09-01T10:00:00Z",
            "acta_renap_pdf": self.fake_pdf_renap
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no pertenece a la propiedad", str(response.data))

    def test_bloqueo_doble_inhumacion_activa_mismo_nicho(self):
        """RNF-02: Bloqueo de concurrencia - Un nicho no admite más de 1 Inhumación ACTIVA simultánea."""
        # Registrar primera inhumación
        RegistroInhumacion.objects.create(
            difunto=self.difunto,
            espacio=self.espacio1,
            contrato=self.contrato_activo,
            usuario_registro=self.user,
            fecha_sepelio=timezone.now(),
            acta_renap_pdf="inhumaciones/actas_renap/test.pdf",
            estado_inhumacion='ACTIVA'
        )

        # Intentar registrar un segundo difunto en el mismo espacio
        segundo_difunto = Difunto.objects.create(
            nombres="Mario Esteban",
            apellidos="Gómez Ruiz",
            fecha_defuncion=date(2026, 8, 31),
            causa_muerte="Accidente"
        )

        url = reverse('registro-inhumacion-list')
        payload = {
            "difunto": segundo_difunto.id,
            "espacio": self.espacio1.id_espacio,
            "contrato": self.contrato_activo.id_contrato,
            "fecha_sepelio": "2026-09-01T12:00:00Z",
            "acta_renap_pdf": self.fake_pdf_renap
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ya se encuentra ocupado", str(response.data))

    def test_exhumacion_y_liberacion_automatica_nicho(self):
        """Prueba la acción de Exhumación/Traslado y la actualización del nicho a 'Reservado' (mantiene propiedad por contrato)."""
        # 1. Crear inhumación activa previa
        registro = RegistroInhumacion.objects.create(
            difunto=self.difunto,
            espacio=self.espacio1,
            contrato=self.contrato_activo,
            usuario_registro=self.user,
            fecha_sepelio=timezone.now(),
            acta_renap_pdf="inhumaciones/actas_renap/test.pdf",
            estado_inhumacion='ACTIVA'
        )
        self.espacio1.estado = self.estado_ocupado
        self.espacio1.save()

        # 2. Ejecutar acción de exhumación
        url = reverse('registro-inhumacion-exhumar', kwargs={'pk': registro.id})
        payload = {
            "nuevo_estado": "EXHUMADO",
            "observaciones": "Exhumación judicial ordenada por orden de Juez competente."
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Comprobar que la inhumación cambió a EXHUMADO
        registro.refresh_from_db()
        self.assertEqual(registro.estado_inhumacion, 'EXHUMADO')
        self.assertIn("Exhumación judicial", registro.observaciones)

        # 4. Comprobar que el espacio pasó a estar 'Reservado'
        self.espacio1.refresh_from_db()
        self.assertEqual(self.espacio1.estado.nombre_estado, "Reservado")

    def test_consulta_publica_memorial_allow_any(self):
        """Prueba que el endpoint público de búsqueda memorial sea accesible sin autenticación y devuelva datos no sensibles."""
        # 1. Crear inhumación de prueba
        RegistroInhumacion.objects.create(
            difunto=self.difunto,
            espacio=self.espacio1,
            contrato=self.contrato_activo,
            usuario_registro=self.user,
            fecha_sepelio=timezone.now(),
            acta_renap_pdf="inhumaciones/actas_renap/test.pdf",
            estado_inhumacion='ACTIVA'
        )

        # 2. Cliente anónimo sin autenticar
        anon_client = APIClient()
        url = reverse('publico-buscar-memorial')
        response = anon_client.get(url, {'q': 'Roberto'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        item = response.data[0]
        self.assertIn("Roberto", item['nombre_completo'])
        self.assertIn("ubicacion", item)
        self.assertNotIn("contrato", item)  # Privacidad: No expone contratos ni datos sensibles

    def test_privacidad_difuntos_e_inhumaciones_requiere_autenticacion(self):
        """NEW-D-01: DifuntoViewSet y RegistroInhumacionViewSet exigen autenticación ante peticiones anónimas."""
        anon_client = APIClient()

        # 1. Petición anónima a difuntos
        res_difunto = anon_client.get(reverse('difunto-list'))
        self.assertEqual(res_difunto.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Petición anónima a registros de inhumación
        res_inhumacion = anon_client.get(reverse('registro-inhumacion-list'))
        self.assertEqual(res_inhumacion.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_validacion_archivo_solo_pdf(self):
        """ARQ-09: Rechazo de archivos que no tengan extensión .pdf en documentos de defunción."""
        fake_txt = SimpleUploadedFile("acta_invalida.txt", b"Contenido de texto no PDF", content_type="text/plain")
        url = reverse('registro-inhumacion-list')
        payload = {
            "difunto": self.difunto.id,
            "espacio": self.espacio1.id_espacio,
            "contrato": self.contrato_activo.id_contrato,
            "fecha_sepelio": "2026-09-01T10:00:00Z",
            "acta_renap_pdf": fake_txt
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pdf", str(response.data).lower())



"""
MÓDULO DE INVENTARIO - PRUEBAS UNITARIAS Y DE INTEGRACIÓN DE API (apps/inventario/tests.py)

Este archivo implementa pruebas automatizadas para validar:
1. Reglas de negocio del modelo ORM (cálculo de capacidad, códigos únicos, restricciones de unicidad).
2. Endpoints CRUD del Módulo B.
3. Endpoint de la Matriz Visual 2D (RF-02).
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

from .models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico
from apps.cuentas.models import Usuario


class InventarioModelTestCase(TestCase):
    """
    Pruebas de modelos relacionales y reglas de negocio del dominio de inventario.
    """

    def setUp(self):
        self.sector = Sector.objects.create(
            nombre_sector="Sector B - Los Olivos",
            nomenclatura="SEC-B",
            descripcion="Sector de prueba"
        )
        self.tipo = TipoEstructura.objects.create(
            nombre_tipo="Capilla",
            descripcion="Capilla familiar"
        )
        self.estado_disponible = EstadoEspacio.objects.create(
            nombre_estado="Disponible"
        )

    def test_creacion_estructura_calcula_capacidad_total(self):
        """Valida que la capacidad total de espacios se calcule automáticamente (filas x columnas)."""
        estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo,
            nombre_estructura="Capilla San Juan",
            codigo_estructura="CAP-01",
            total_filas=3,
            total_columnas=4
        )
        self.assertEqual(estructura.capacidad_total_espacios, 12)

    def test_creacion_espacio_autogenera_codigo_unico(self):
        """Valida que el código único del espacio se genere con el formato [SECTOR]-[ESTRUCTURA]-F[FILA]-C[COLUMNA]."""
        estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo,
            nombre_estructura="Capilla San Juan",
            codigo_estructura="CAP-01",
            total_filas=3,
            total_columnas=4
        )
        espacio = EspacioFisico.objects.create(
            estructura=estructura,
            estado=self.estado_disponible,
            posicion_fila=2,
            posicion_columna=3
        )
        self.assertEqual(espacio.codigo_unico_espacio, "SEC-B-CAP-01-F2-C3")

    def test_validacion_posicion_fuera_de_limite(self):
        """Valida que se lance ValidationError si la posición supera el límite de filas o columnas de la estructura."""
        estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo,
            nombre_estructura="Capilla San Juan",
            codigo_estructura="CAP-01",
            total_filas=2,
            total_columnas=2
        )
        espacio_invalido = EspacioFisico(
            estructura=estructura,
            estado=self.estado_disponible,
            posicion_fila=5,
            posicion_columna=1
        )
        with self.assertRaises(ValidationError):
            espacio_invalido.full_clean()


class InventarioAPITestCase(TestCase):
    """
    Pruebas de endpoints REST API del Módulo B.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            username="test_inventario_user",
            email="inv@test.com",
            password="Password123!"
        )
        self.client.force_authenticate(user=self.user)
        self.sector = Sector.objects.create(
            nombre_sector="Sector A - Jardines",
            nomenclatura="SEC-A"
        )
        self.tipo = TipoEstructura.objects.create(
            nombre_tipo="Pabellón"
        )
        self.estado_disponible = EstadoEspacio.objects.create(
            nombre_estado="Disponible"
        )
        self.estructura = EstructuraFisica.objects.create(
            sector=self.sector,
            tipo_estructura=self.tipo,
            nombre_estructura="Pabellón San José",
            codigo_estructura="PAB-01",
            total_filas=2,
            total_columnas=2
        )
        self.espacio = EspacioFisico.objects.create(
            estructura=self.estructura,
            estado=self.estado_disponible,
            posicion_fila=1,
            posicion_columna=1,
            precio_individual=15000.00
        )

    def test_listado_sectores(self):
        response = self.client.get('/api/v1/inventario/sectores/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_listado_estructuras(self):
        response = self.client.get('/api/v1/inventario/estructuras/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_endpoint_matriz_2d(self):
        """Valida la respuesta del endpoint especializado GET /api/v1/inventario/estructuras/{id}/matriz/ (RF-02)."""
        url = f'/api/v1/inventario/estructuras/{self.estructura.id_estructura}/matriz/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['id_estructura'], self.estructura.id_estructura)
        self.assertEqual(data['codigo_estructura'], 'PAB-01')
        self.assertEqual(data['nomenclatura_sector'], 'SEC-A')
        self.assertEqual(data['total_filas'], 2)
        self.assertEqual(data['total_columnas'], 2)
        self.assertEqual(data['capacidad_total_espacios'], 4)
        self.assertIn('matriz_espacios', data)
        self.assertEqual(len(data['matriz_espacios']), 1)
        self.assertEqual(data['matriz_espacios'][0]['codigo_unico_espacio'], 'SEC-A-PAB-01-F1-C1')

    def test_actualizacion_parcial_espacio(self):
        """Valida que actualizar un nicho sin enviar fila/columna funcione correctamente (200 OK)."""
        url = f'/api/v1/inventario/espacios/{self.espacio.id_espacio}/'
        payload = {
            "precio_individual": 18000.00,
            "material_construccion": "Mármol"
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.espacio.refresh_from_db()
        self.assertEqual(float(self.espacio.precio_individual), 18000.00)

    def test_posicion_duplicada_mensaje_amigable(self):
        """Valida que intentar registrar un nicho en una coordenada ocupada devuelva un error amigable (400 Bad Request)."""
        url = '/api/v1/inventario/espacios/'
        payload = {
            "estructura": self.estructura.id_estructura,
            "estado": self.estado_disponible.id_estado,
            "posicion_fila": 1,
            "posicion_columna": 1
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No es posible registrar o mover el nicho", str(response.data))

    def test_actualizacion_estado_str_resuelto_a_pk(self):
        """Valida que si se envía el nombre del estado en string (ej. 'Disponible'), se resuelva correctamente sin error 400 de tipado."""
        url = f'/api/v1/inventario/espacios/{self.espacio.id_espacio}/'
        payload = {
            "estado": "Disponible",
            "precio_individual": 20000.00
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

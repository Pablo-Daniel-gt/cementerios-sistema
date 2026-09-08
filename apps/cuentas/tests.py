"""
MÓDULO DE CUENTAS - PRUEBAS UNITARIAS Y DE INTEGRACIÓN (apps/cuentas/tests.py)

Este archivo contiene las pruebas automatizadas para verificar el correcto funcionamiento
de las APIs REST (Serializadores, Vistas y URLs) para los 4 modelos del Módulo A.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Rol, Usuario, Cliente, Bitacora


class CuentasAPITestCase(TestCase):
    """
    Suite de pruebas para los endpoints de la API REST del módulo cuentas.
    """
    def setUp(self):
        """Configuración inicial del entorno de pruebas (datos de prueba)."""
        self.client = APIClient()

        # Rol de prueba
        self.rol_admin = Rol.objects.create(
            nombre="Administrador",
            descripcion="Acceso total al sistema"
        )

        # Usuario de prueba
        self.usuario_test = Usuario.objects.create_user(
            username="admin_test",
            email="admin@test.com",
            password="Password123!",
            rol=self.rol_admin,
            telefono="12345678"
        )

        # Autenticar cliente DRF para pruebas protegidas
        self.client.force_authenticate(user=self.usuario_test)

        # Cliente de prueba
        self.cliente_test = Cliente.objects.create(
            cui="1234567890101",
            nombres="Juan",
            apellidos="Pérez",
            telefono="87654321",
            correo="juan@test.com",
            usuario=self.usuario_test
        )

    def test_rol_list_create(self):
        """Prueba listar y crear roles vía API REST."""
        url = reverse('rol-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

        # Crear
        data = {"nombre": "Asesor Comercial", "descripcion": "Gestión de ventas"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rol.objects.filter(nombre="Asesor Comercial").count(), 1)

    def test_usuario_password_write_only(self):
        """Prueba que el campo contraseña sea write_only y no se exponga en la respuesta GET/POST."""
        url = reverse('usuario-list')
        
        # 1. Verificar GET no expone 'password'
        response_get = self.client.get(reverse('usuario-detail', kwargs={'pk': self.usuario_test.pk}))
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertNotIn('password', response_get.data)

        # 2. Crear un nuevo usuario y verificar hashing
        user_data = {
            "username": "nuevo_usuario",
            "email": "nuevo@test.com",
            "password": "PasswordSegura123!",
            "rol": self.rol_admin.id,
            "telefono": "55555555"
        }
        response_post = self.client.post(url, user_data, format='json')
        self.assertEqual(response_post.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response_post.data)

        # Verificar que la contraseña fue encriptada correctamente
        nuevo_user = Usuario.objects.get(username="nuevo_usuario")
        self.assertTrue(nuevo_user.check_password("PasswordSegura123!"))

    def test_cliente_crud(self):
        """Prueba operaciones CRUD sobre el endpoint de Clientes."""
        url = reverse('cliente-list')
        
        # Listar clientes
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Crear cliente
        data = {
            "cui": "9876543210101",
            "nombres": "María",
            "apellidos": "Gómez",
            "telefono": "44443333",
            "correo": "maria@test.com"
        }
        response_post = self.client.post(url, data, format='json')
        self.assertEqual(response_post.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Cliente.objects.filter(cui="9876543210101").count(), 1)

    def test_bitacora_list(self):
        """Prueba consultar la bitácora de auditoría."""
        url = reverse('bitacora-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_mi_cliente_endpoint(self):
        """Prueba endpoint dedicado /me/cliente/ para el portal de autogestión (RF-03)."""
        url = reverse('mi-cliente')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['cui'], self.cliente_test.cui)
        self.assertEqual(response.data['nombres'], self.cliente_test.nombres)

    def test_unauthenticated_request_denied(self):
        """Prueba que peticiones anónimas a endpoints privados retornen 401 Unauthorized (SEC-05)."""
        anon_client = APIClient()
        url = reverse('cliente-list')
        response = anon_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_signals_bitacora_automatica(self):
        """Prueba que la creación de entidades dispare señales automáticas de auditoría (RNF-08)."""
        conteo_inicial = Bitacora.objects.count()
        
        # Crear nuevo cliente para disparar signal
        Cliente.objects.create(
            cui="5555555550101",
            nombres="Auditoría",
            apellidos="Test",
            correo="auditoria@test.com"
        )
        
        conteo_final = Bitacora.objects.count()
        self.assertGreater(conteo_final, conteo_inicial)
        
        ultima_bitacora = Bitacora.objects.latest('id')
        self.assertEqual(ultima_bitacora.tabla_afectada, 'Cliente')
        self.assertEqual(ultima_bitacora.accion, 'INSERT')

"""
COMANDO DE GESTIÓN: POBLADO DE DATOS SEMILLA PARA EL MÓDULO DE CUENTAS
python manage.py seed_cuentas

Este comando crea automáticamente:
1. Los Roles del sistema:
   - Administrador (Acceso total al sistema y administración)
   - Secretaria (Atención al cliente, cotizaciones, cobros, inhumaciones)
   - Asesor Comercial (Ventas, cotizaciones comerciales y clientes)
   - Cliente Propietario (Acceso exclusivo a portal de clientes)
   - Jardinero (Mantenimiento y operaciones de campo)
2. Asigna automáticamente el rol 'Administrador' a cualquier superusuario existente sin rol asignado.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.cuentas.models import Rol, Usuario


class Command(BaseCommand):
    help = 'Poblar la base de datos con roles y configuraciones iniciales del módulo Cuentas.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando poblado de roles y cuentas base...'))

        with transaction.atomic():
            roles_data = [
                {
                    'nombre': 'Administrador',
                    'descripcion': 'Acceso total al sistema, configuraciones, usuarios, roles y auditoría.'
                },
                {
                    'nombre': 'Secretaria',
                    'descripcion': 'Persona encargada de la atención al cliente, cotizaciones, cobros en caja e inhumaciones.'
                },
                {
                    'nombre': 'Asesor Comercial',
                    'descripcion': 'Gestión de ventas, cotizaciones comerciales y seguimiento de clientes.'
                },
                {
                    'nombre': 'Cliente Propietario',
                    'descripcion': 'Persona propietaria de un bien dentro del camposanto con acceso a su portal privado.'
                },
                {
                    'nombre': 'Jardinero',
                    'descripcion': 'Encargado del mantenimiento y limpieza de los espacios verdes del camposanto.'
                },
            ]

            roles_creados = {}
            for item in roles_data:
                rol_obj, created = Rol.objects.get_or_create(
                    nombre=item['nombre'],
                    defaults={'descripcion': item['descripcion']}
                )
                roles_creados[rol_obj.nombre] = rol_obj
                action_str = 'creado' if created else 'ya existente'
                self.stdout.write(f"  - Rol [{rol_obj.nombre}]: {action_str}")

            # Asignar rol Administrador al superusuario si no tiene rol asignado
            rol_admin = roles_creados.get('Administrador')
            if rol_admin:
                superusers_updated = Usuario.objects.filter(is_superuser=True, rol__isnull=True).update(rol=rol_admin)
                if superusers_updated > 0:
                    self.stdout.write(self.style.SUCCESS(f"  - Asignado rol 'Administrador' a {superusers_updated} superusuario(s)."))

        self.stdout.write(self.style.SUCCESS('¡Roles y cuentas base configurados exitosamente!'))

"""
COMANDO DE GESTIÓN: POBLADO DE DATOS SEMILLA PARA MÓDULO COMERCIAL
python manage.py seed_comercial

Este comando crea automáticamente:
1. Las 6 Modalidades de Venta (Contado, Crédito 12, 24, 36, 48 y 60 Meses).
2. Los 4 Estados de Contrato (Solicitado, Activo, Liquidado, Cancelado).
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.comercial.models import ModalidadVenta, EstadoContrato


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos semilla iniciales para el módulo Comercial.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando poblado de datos semilla para el módulo Comercial...'))

        with transaction.atomic():
            # 1. Poblar Modalidades de Venta
            modalidades_data = [
                {'nombre_modalidad': 'Contado', 'aplica_credito': False, 'descripcion': 'Pago 100% al momento de firmar contrato.'},
                {'nombre_modalidad': 'Crédito 12 Meses', 'aplica_credito': True, 'descripcion': 'Financiamiento a 1 año en 12 cuotas fijas.'},
                {'nombre_modalidad': 'Crédito 24 Meses', 'aplica_credito': True, 'descripcion': 'Financiamiento a 2 años en 24 cuotas fijas.'},
                {'nombre_modalidad': 'Crédito 36 Meses', 'aplica_credito': True, 'descripcion': 'Financiamiento a 3 años en 36 cuotas fijas.'},
                {'nombre_modalidad': 'Crédito 48 Meses', 'aplica_credito': True, 'descripcion': 'Financiamiento a 4 años en 48 cuotas fijas.'},
                {'nombre_modalidad': 'Crédito 60 Meses', 'aplica_credito': True, 'descripcion': 'Financiamiento a 5 años en 60 cuotas fijas.'},
            ]

            for item in modalidades_data:
                obj, created = ModalidadVenta.objects.get_or_create(
                    nombre_modalidad=item['nombre_modalidad'],
                    defaults={
                        'aplica_credito': item['aplica_credito'],
                        'descripcion': item['descripcion']
                    }
                )
                action_str = 'creada' if created else 'ya existente'
                self.stdout.write(f"  - Modalidad [{obj.nombre_modalidad}]: {action_str}")

            # 2. Poblar Estados de Contrato
            estados_data = [
                'Solicitado',
                'Activo',
                'Liquidado',
                'Cancelado',
            ]

            for nombre in estados_data:
                obj, created = EstadoContrato.objects.get_or_create(
                    nombre_estado_contrato=nombre
                )
                action_str = 'creado' if created else 'ya existente'
                self.stdout.write(f"  - Estado de Contrato [{obj.nombre_estado_contrato}]: {action_str}")

        self.stdout.write(self.style.SUCCESS('¡Semilla comercial poblada exitosamente!'))

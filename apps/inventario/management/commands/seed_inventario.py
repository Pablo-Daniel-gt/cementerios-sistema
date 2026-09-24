"""
COMANDO DE GESTIÓN: POBLADO DE DATOS SEMILLA PARA INVENTARIO
python manage.py seed_inventario

Este comando crea automáticamente:
1. Los 4 estados base de espacios físicos con sus colores HEX (Disponible, Reservado, Ocupado, Mantenimiento).
2. Un Sector de prueba ("Sector A - Jardines").
3. Un Tipo de Estructura ("Pabellón").
4. Una Estructura Física de 4x5 nichos ("Pabellón San José", 20 espacios en total).
5. 20 Espacios Físicos (nichos) distribuidos con diferentes estados para validar la Matriz 2D (RF-02).
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.inventario.models import Sector, TipoEstructura, EstadoEspacio, EstructuraFisica, EspacioFisico


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos semilla iniciales para el módulo de Inventario.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando poblado de datos semilla para el módulo de Inventario...'))

        with transaction.atomic():
            # 1. Crear Estados de Espacio por defecto
            estados_data = [
                'Disponible',
                'Reservado',
                'Ocupado',
                'Mantenimiento',
            ]

            estados_dict = {}
            for nombre in estados_data:
                obj, created = EstadoEspacio.objects.get_or_create(
                    nombre_estado=nombre
                )
                estados_dict[obj.nombre_estado] = obj
                action_str = 'creado' if created else 'ya existente'
                self.stdout.write(f'  - Estado [{obj.nombre_estado}]: {action_str}')

            # 2. Crear Sectores
            sectores_data = [
                {'nomenclatura': 'SEC-A', 'nombre_sector': 'Sector A - Jardines', 'descripcion': 'Sector principal de jardines y pabellones sobre superficie'},
                {'nomenclatura': 'SEC-B', 'nombre_sector': 'Sector B - Pared de Memorias', 'descripcion': 'Pared al lado norte del camposanto.'},
            ]
            sectores_dict = {}
            for sec in sectores_data:
                sector, created = Sector.objects.get_or_create(
                    nomenclatura=sec['nomenclatura'],
                    defaults={
                        'nombre_sector': sec['nombre_sector'],
                        'descripcion': sec['descripcion']
                    }
                )
                sectores_dict[sec['nomenclatura']] = sector
                action_str = 'creado' if created else 'ya existente'
                self.stdout.write(f'  - Sector [{sector.nombre_sector}]: {action_str}')

            # 3. Crear Tipos de Estructura
            tipos_data = [
                {'nombre_tipo': 'Pabellón', 'descripcion': 'Estructura vertical sobre superficie para nichos individuales'},
                {'nombre_tipo': 'Capilla', 'descripcion': 'Estructura conformada por varios nichos y un espacio para que la familia coloque recuerdos, altares, entre otros.'},
                {'nombre_tipo': 'Pared', 'descripcion': 'Estructura recta con gran capacidad para nichos individuales'},
                {'nombre_tipo': 'Mausoleo', 'descripcion': 'Estructura funeraria familiar independiente'}
            ]
            tipos_dict = {}
            for tip in tipos_data:
                tipo_obj, created = TipoEstructura.objects.get_or_create(
                    nombre_tipo=tip['nombre_tipo'],
                    defaults={'descripcion': tip['descripcion']}
                )
                tipos_dict[tip['nombre_tipo']] = tipo_obj
                action_str = 'creado' if created else 'ya existente'
                self.stdout.write(f'  - Tipo Estructura [{tipo_obj.nombre_tipo}]: {action_str}')

            # 4. Crear Estructura Física de Ejemplo (Pabellón San José 4x5 = 20 nichos)
            sec_a = sectores_dict.get('SEC-A')
            tipo_pab = tipos_dict.get('Pabellón')
            if sec_a and tipo_pab:
                estructura, created = EstructuraFisica.objects.get_or_create(
                    codigo_estructura='PAB-01',
                    defaults={
                        'sector': sec_a,
                        'tipo_estructura': tipo_pab,
                        'nombre_estructura': 'Pabellón San José',
                        'total_filas': 4,
                        'total_columnas': 5,
                        'precio_estructura_completa': None
                    }
                )
                action_str = 'creada' if created else 'ya existente'
                self.stdout.write(f'  - Estructura [{estructura.nombre_estructura}] (4x5): {action_str}')

                # 5. Crear Espacios Físicos (Nichos) en estado Disponible
                estado_disponible = estados_dict.get('Disponible')
                espacios_creados = 0
                for fila in range(1, 5):
                    for col in range(1, 6):
                        codigo_esperado = f"{sec_a.nomenclatura}-{estructura.codigo_estructura}-F{fila}-C{col}"
                        espacio, sp_created = EspacioFisico.objects.get_or_create(
                            estructura=estructura,
                            posicion_fila=fila,
                            posicion_columna=col,
                            defaults={
                                'estado': estado_disponible,
                                'codigo_unico_espacio': codigo_esperado,
                                'precio_individual': 15000.00,
                                'dimensiones': '2.20m x 0.90m x 0.80m',
                                'material_construccion': 'Concreto Reforzado'
                            }
                        )
                        if sp_created:
                            espacios_creados += 1

                self.stdout.write(f'  - Espacios Físicos creados: {espacios_creados} / Total grilla: 20')

        self.stdout.write(self.style.SUCCESS('¡Semilla de inventario poblada exitosamente!'))

# Sistema Web para la Administración Comercial, Control de Inhumaciones y Reservación de Espacios en Cementerios del Sector Privado de Huehuetenango

**Proyecto de Tesis**  
**Autor:** Pablo Daniel Molina Villatoro  
**Institución:** Universidad Mariano Gálvez de Guatemala  

---

## 📝 Descripción General

### Descripción del Problema
En el sector privado de cementerios en el municipio y departamento de Huehuetenango, los procesos administrativos de comercialización, control de inhumaciones y reservación de espacios físicos (nichos, mausoleos y lotes) han dependido tradicionalmente de registros manuales o sistemas descentralizados. Esta falta de automatización genera ineficiencias operativas, riesgos de duplicidad o inconsistencia en la asignación de espacios, demoras en las consultas de clientes y falta de trazabilidad en las operaciones de sepelios e historial de pagos.

### Solución Propuesta
El **Sistema Web para la Administración Comercial, Control de Inhumaciones y Reservación de Espacios** es una solución integral orientada a modernizar y optimizar la gestión operativa y comercial de los camposantos privados. Ofrece una plataforma centralizada y segura que permite administrar eficientemente el catálogo de inmuebles, agilizar la atención a clientes, automatizar procesos de cotización y cobranza, y llevar un registro riguroso e interactivo de sepelios con altos estándares de calidad, seguridad e integridad referencial.

---

## 🛠️ Stack Tecnológico

- **Lenguaje de Programación:** Python
- **Framework Web Backend:** Django
- **Base de Datos:** PostgreSQL
- **Frontend & UI:** React + Vite, Bootstrap 5 (HTML5 / CSS3 / JavaScript)

---

## 📌 Estado del Proyecto: Módulos Backend (Estables y Operativos)

El backend del sistema cuenta con una arquitectura relacional sólida y probada en PostgreSQL a través de sus cuatro módulos principales:

### 🔐 Módulo A: Autenticación, Usuarios y Clientes (`apps.cuentas`)
- **Seguridad por Roles (RNF-08):** Control de acceso por perfiles (Administrador, Asesor Comercial, Cliente Propietario).
- **Portal de Clientes (RF-03):** Gestión de titulares por CUI/DPI.
- **Bitácora de Auditoría y Trazabilidad (RNF-08):** Registro detallado de operaciones de sistema en formato JSON.

### 🏛️ Módulo B: Inventario de Inmuebles y Camposanto (`apps.inventario`)
- **Jerarquía Física Fija:** `Sector` $\rightarrow$ `EstructuraFisica` $\rightarrow$ `EspacioFisico`.
- **Matriz Visual e Interactiva 2D (RF-02):** Coordenadas `(fila, columna)` y colores de disponibilidad (`Disponible`, `Reservado`, `Ocupado`, `Mantenimiento`).
- **Generación Masiva de Nichos:** Acciones administrativas para poblar grillas 2D por estructura.

### 💰 Módulo C: Gestión Comercial y Financiera (`apps.comercial`)
- **Cotizador Financiero y Contratos (RF-01):** Modalidades Contado/Crédito y generación de tablas de amortización en Quetzales.
- **Caja y Recibos con Desglose Contable:** Registro de cobros con aplicación en cascada a cuotas y cobros de mantenimiento anual.
- **Alertas de Cobranza y Mora (RF-06):** Clasificación de morosidad (Preventivo, Operativo, Extrajudicial).

### ⚰️ Módulo D: Registro Operativo de Inhumaciones y Exhumaciones (`apps.inhumaciones`)
- **Requisitos Legales y Anexos (RF-04):** Formulario de sepelio con carga multipart de Actas RENAP y Certificados MSPAS en PDF.
- **Validación Comercial de Solvencia (RF-05):** Verificación de contratos activos/liquidados y bloqueo ante saldos en mora.
- **Capacidad Atómica y Exhumación (RNF-02):** Restricción de máx 1 inhumación activa por nicho con actualización atómica a 'Ocupado', y liberación automática a 'Disponible' al procesar una exhumación.

---

## 📋 Pruebas Unitarias y Cobertura

El backend cuenta con una suite automatizada de pruebas unitarias e integración ejecutadas mediante Django Test Framework:
```bash
python manage.py test
```
- **Total de pruebas:** 28 tests pasados exitosamente (`OK`).


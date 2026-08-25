import api from './axios';

/**
 * MÓDULO C - SERVICIOS DE API REST COMERCIAL Y FINANCIERA (client/src/api/comercial.api.js)
 */

// 1. Cotizador Financiero (RF-01)
export const simularCotizacion = (data) =>
  api.post('comercial/cotizar/', data);

export const descargarCotizacionPDF = (data) =>
  api.post('comercial/cotizar/?pdf=true', data, { responseType: 'blob' });

// 2. Catálogos Auxiliares
export const getModalidadesVenta = () =>
  api.get('comercial/modalidades/');

export const getEstadosContrato = () =>
  api.get('comercial/estados-contrato/');

// 3. Contratos Comerciales
export const getContratos = (params) =>
  api.get('comercial/contratos/', { params });

export const getContrato = (id) =>
  api.get(`comercial/contratos/${id}/`);

export const createContrato = (data) =>
  api.post('comercial/contratos/', data);

export const getEstadoCuenta = (id) =>
  api.get(`comercial/contratos/${id}/estado-cuenta/`);

// 4. Plan de Cuotas y Mantenimiento
export const getPlanCuotas = (params) =>
  api.get('comercial/plan-cuotas/', { params });

export const getControlMantenimientos = (params) =>
  api.get('comercial/control-mantenimiento/', { params });

// 5. Caja y Recibos de Pago
export const getRecibos = (params) =>
  api.get('comercial/recibos/', { params });

export const getRecibo = (id) =>
  api.get(`comercial/recibos/${id}/`);

export const createRecibo = (data) =>
  api.post('comercial/recibos/', data);

export const updateRecibo = (id, data) =>
  api.patch(`comercial/recibos/${id}/`, data);

export const descargarReciboPDF = (id) =>
  api.get(`comercial/recibos/${id}/pdf/`, { responseType: 'blob' });

// 6. Alertas de Cobranza y Mora (RF-06)
export const getAlertasMora = () =>
  api.get('comercial/alertas-mora/');

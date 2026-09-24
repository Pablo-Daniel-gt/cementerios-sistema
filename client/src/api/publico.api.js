import api from './axios';

/**
 * SERVICIOS API REST PARA EL PORTAL PÚBLICO Y LANDING PAGE MEMORIAL
 * client/src/api/publico.api.js
 */

/**
 * Búsqueda pública de difuntos y registros de sepelio (AllowAny)
 * @param {string} termino - Nombre, Apellidos, CUI o código de espacio
 */
export const buscarMemorialPublico = (termino = '') => {
  return api.get('inhumaciones/publico/buscar/', {
    params: termino ? { q: termino } : {}
  });
};

/**
 * Catálogo público de tipos de nichos, capacidades y tarifas base
 */
export const getCatalogoEspaciosPublico = () => {
  return api.get('inventario/publico/tipos-espacio/');
};

/**
 * Simulación de cotización pública (RF-01)
 * @param {Object} data - { monto_total, monto_enganche, plazo_meses, cliente_nombre }
 */
export const simularCotizacionPublica = (data) => {
  return api.post('comercial/cotizar/', data);
};

/**
 * Descarga de cotización formal en PDF
 * @param {Object} data - { monto_total, monto_enganche, plazo_meses, cliente_nombre }
 */
export const descargarCotizacionPublicaPDF = (data) => {
  return api.post('comercial/cotizar/?pdf=true', data, {
    responseType: 'blob'
  });
};

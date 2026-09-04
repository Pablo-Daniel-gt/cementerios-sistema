import axios from './axios';

/**
 * MÓDULO D - SERVICIOS API REST DE INHUMACIONES Y EXHUMACIONES
 * client/src/api/inhumaciones.api.js
 */

// ==============================================================================
// 1. SERVICIOS DE DIFUNTOS
// ==============================================================================
export const getDifuntos = (params) => {
  return axios.get('inhumaciones/difuntos/', { params });
};

export const getDifunto = (id) => {
  return axios.get(`inhumaciones/difuntos/${id}/`);
};

export const crearDifunto = (datos) => {
  return axios.post('inhumaciones/difuntos/', datos);
};

export const actualizarDifunto = (id, datos) => {
  return axios.put(`inhumaciones/difuntos/${id}/`, datos);
};

export const eliminarDifunto = (id) => {
  return axios.delete(`inhumaciones/difuntos/${id}/`);
};

// ==============================================================================
// 2. SERVICIOS DE REGISTROS DE INHUMACIÓN Y EXHUMACIÓN
// ==============================================================================
export const getRegistrosInhumacion = (params) => {
  return axios.get('inhumaciones/registros/', { params });
};

export const getRegistroInhumacion = (id) => {
  return axios.get(`inhumaciones/registros/${id}/`);
};

/**
 * Registro de Sepelio con subida multipart de archivos PDF (acta_renap_pdf, certificado_mspas_pdf)
 * @param {FormData} formData
 */
export const crearRegistroInhumacion = (formData) => {
  return axios.post('inhumaciones/registros/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const actualizarRegistroInhumacion = (id, formData) => {
  return axios.patch(`inhumaciones/registros/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const eliminarRegistroInhumacion = (id) => {
  return axios.delete(`inhumaciones/registros/${id}/`);
};

/**
 * Procesa la Exhumación o Traslado de un difunto y libera el nicho a 'Disponible'
 * @param {number|string} id - ID del registro de inhumación
 * @param {Object} data - { nuevo_estado: 'EXHUMADO' | 'TRASLADADO', observaciones: string }
 */
export const exhumarRegistro = (id, data) => {
  return axios.post(`inhumaciones/registros/${id}/exhumar/`, data);
};

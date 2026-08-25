import axios from './axios';

// ==============================================================================
// 1. SERVICIOS DE SECTORES
// ==============================================================================
export const getSectores = () => {
  return axios.get('inventario/sectores/');
};

export const getSector = (id) => {
  return axios.get(`inventario/sectores/${id}/`);
};

export const crearSector = (datos) => {
  return axios.post('inventario/sectores/', datos);
};

export const actualizarSector = (id, datos) => {
  return axios.put(`inventario/sectores/${id}/`, datos);
};

export const eliminarSector = (id) => {
  return axios.delete(`inventario/sectores/${id}/`);
};

// ==============================================================================
// 2. SERVICIOS DE TIPOS DE ESTRUCTURA
// ==============================================================================
export const getTiposEstructura = () => {
  return axios.get('inventario/tipos-estructura/');
};

export const getTipoEstructura = (id) => {
  return axios.get(`inventario/tipos-estructura/${id}/`);
};

export const crearTipoEstructura = (datos) => {
  return axios.post('inventario/tipos-estructura/', datos);
};

export const actualizarTipoEstructura = (id, datos) => {
  return axios.put(`inventario/tipos-estructura/${id}/`, datos);
};

export const eliminarTipoEstructura = (id) => {
  return axios.delete(`inventario/tipos-estructura/${id}/`);
};

// ==============================================================================
// 3. SERVICIOS DE ESTADOS DE ESPACIO
// ==============================================================================
export const getEstadosEspacio = () => {
  return axios.get('inventario/estados-espacio/');
};

export const getEstadoEspacio = (id) => {
  return axios.get(`inventario/estados-espacio/${id}/`);
};

// ==============================================================================
// 4. SERVICIOS DE ESTRUCTURAS FÍSICAS Y MATRIZ 2D (RF-02)
// ==============================================================================
export const getEstructuras = () => {
  return axios.get('inventario/estructuras/');
};

export const getEstructura = (id) => {
  return axios.get(`inventario/estructuras/${id}/`);
};

export const crearEstructura = (datos) => {
  return axios.post('inventario/estructuras/', datos);
};

export const actualizarEstructura = (id, datos) => {
  return axios.put(`inventario/estructuras/${id}/`, datos);
};

export const eliminarEstructura = (id) => {
  return axios.delete(`inventario/estructuras/${id}/`);
};

/**
 * Endpoint Especializado para la Matriz Visual 2D (RF-02)
 */
export const getMatrizEstructura = (idEstructura) => {
  return axios.get(`inventario/estructuras/${idEstructura}/matriz/`);
};

/**
 * Generación en Lote de Nichos para una Estructura
 */
export const generarLoteEspacios = (idEstructura) => {
  return axios.post(`inventario/estructuras/${idEstructura}/generar-lote/`);
};

// ==============================================================================
// 5. SERVICIOS DE ESPACIOS FÍSICOS (NICHOS)
// ==============================================================================
export const getEspacios = (params) => {
  return axios.get('inventario/espacios/', { params });
};

export const getEspacio = (idEspacio) => {
  return axios.get(`inventario/espacios/${idEspacio}/`);
};

export const crearEspacio = (datos) => {
  return axios.post('inventario/espacios/', datos);
};

export const actualizarEspacio = (idEspacio, datos) => {
  return axios.patch(`inventario/espacios/${idEspacio}/`, datos);
};

export const eliminarEspacio = (idEspacio) => {
  return axios.delete(`inventario/espacios/${idEspacio}/`);
};

export const cambiarEstadoEspacio = (idEspacio, estadoId) => {
  return axios.patch(`inventario/espacios/${idEspacio}/`, { estado: estadoId });
};

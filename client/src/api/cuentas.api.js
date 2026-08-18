import axios from './axios';

// ==============================================================================
// 1. SERVICIOS DE AUTENTICACIÓN
// ==============================================================================
export const loginApi = (credenciales) => {
  return axios.post('login/', credenciales);
};

export const obtenerPerfilApi = () => {
  return axios.get('me/');
};

// ==============================================================================
// 2. SERVICIOS DE ROLES
// ==============================================================================
export const obtenerRoles = () => {
  return axios.get('roles/');
};

export const obtenerRol = (id) => {
  return axios.get(`roles/${id}/`);
};

export const crearRol = (datos) => {
  return axios.post('roles/', datos);
};

export const actualizarRol = (id, datos) => {
  return axios.put(`roles/${id}/`, datos);
};

export const eliminarRol = (id) => {
  return axios.delete(`roles/${id}/`);
};

// ==============================================================================
// 3. SERVICIOS DE USUARIOS
// ==============================================================================
export const obtenerUsuarios = () => {
  return axios.get('usuarios/');
};

export const obtenerUsuario = (id) => {
  return axios.get(`usuarios/${id}/`);
};

export const crearUsuario = (datos) => {
  return axios.post('usuarios/', datos);
};

export const actualizarUsuario = (id, datos) => {
  return axios.put(`usuarios/${id}/`, datos);
};

export const eliminarUsuario = (id) => {
  return axios.delete(`usuarios/${id}/`);
};

// ==============================================================================
// 4. SERVICIOS DE CLIENTES (TITULARES)
// ==============================================================================
export const obtenerClientes = () => {
  return axios.get('clientes/');
};

export const obtenerCliente = (id) => {
  return axios.get(`clientes/${id}/`);
};

export const crearCliente = (datos) => {
  return axios.post('clientes/', datos);
};

export const actualizarCliente = (id, datos) => {
  return axios.put(`clientes/${id}/`, datos);
};

export const eliminarCliente = (id) => {
  return axios.delete(`clientes/${id}/`);
};

// ==============================================================================
// 5. SERVICIO DE BITÁCORA DE AUDITORÍA
// ==============================================================================
export const obtenerBitacora = () => {
  return axios.get('bitacora/');
};

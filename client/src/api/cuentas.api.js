import axios from './axios';

// ==============================================================================
// 1. SERVICIOS DE AUTENTICACIÓN
// ==============================================================================
export const loginApi = (credenciales) => {
  return axios.post('cuentas/login/', credenciales);
};

export const obtenerPerfilApi = () => {
  return axios.get('cuentas/me/');
};

export const obtenerMiCliente = () => {
  return axios.get('cuentas/me/cliente/');
};


// ==============================================================================
// 2. SERVICIOS DE ROLES
// ==============================================================================
export const obtenerRoles = () => {
  return axios.get('cuentas/roles/');
};

export const obtenerRol = (id) => {
  return axios.get(`cuentas/roles/${id}/`);
};

export const crearRol = (datos) => {
  return axios.post('cuentas/roles/', datos);
};

export const actualizarRol = (id, datos) => {
  return axios.put(`cuentas/roles/${id}/`, datos);
};

export const eliminarRol = (id) => {
  return axios.delete(`cuentas/roles/${id}/`);
};

// ==============================================================================
// 3. SERVICIOS DE USUARIOS
// ==============================================================================
export const obtenerUsuarios = () => {
  return axios.get('cuentas/usuarios/');
};

export const obtenerUsuario = (id) => {
  return axios.get(`cuentas/usuarios/${id}/`);
};

export const crearUsuario = (datos) => {
  return axios.post('cuentas/usuarios/', datos);
};

export const actualizarUsuario = (id, datos) => {
  return axios.put(`cuentas/usuarios/${id}/`, datos);
};

export const eliminarUsuario = (id) => {
  return axios.delete(`cuentas/usuarios/${id}/`);
};

// ==============================================================================
// 4. SERVICIOS DE CLIENTES (TITULARES)
// ==============================================================================
export const obtenerClientes = () => {
  return axios.get('cuentas/clientes/');
};

export const obtenerCliente = (id) => {
  return axios.get(`cuentas/clientes/${id}/`);
};

export const crearCliente = (datos) => {
  return axios.post('cuentas/clientes/', datos);
};

export const actualizarCliente = (id, datos) => {
  return axios.put(`cuentas/clientes/${id}/`, datos);
};

export const eliminarCliente = (id) => {
  return axios.delete(`cuentas/clientes/${id}/`);
};

// ==============================================================================
// 5. SERVICIO DE BITÁCORA DE AUDITORÍA
// ==============================================================================
export const obtenerBitacora = () => {
  return axios.get('cuentas/bitacora/');
};

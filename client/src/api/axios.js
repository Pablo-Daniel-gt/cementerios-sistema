import axios from 'axios';
import toast from 'react-hot-toast';

// Instancia centralizada de Axios apuntando a la versión 1 de la API (/api/v1/)
const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de peticiones (Request Interceptor)
instance.interceptors.request.use(
  (config) => {
    // 1. Adjuntar Token de Autenticación de localStorage si está disponible
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // 2. Garantizar que las URLs terminen con '/' para evitar redirecciones 301 de DRF
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url += '/';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas (Response Interceptor)
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          toast.error(data?.detail || data?.error || 'Sesión no autorizada o expirada. Por favor inicie sesión.');
          break;
        case 403:
          toast.error(data?.detail || data?.error || 'No tiene permisos suficientes para realizar esta acción.');
          break;
        case 404:
          toast.error(data?.detail || data?.error || 'El recurso solicitado no existe.');
          break;
        case 400:
          if (typeof data === 'object' && data !== null) {
            const firstKey = Object.keys(data)[0];
            let msg = data[firstKey];
            if (Array.isArray(msg)) msg = msg[0];
            if (typeof msg === 'object' && msg !== null) {
              const subKey = Object.keys(msg)[0];
              const subVal = Array.isArray(msg[subKey]) ? msg[subKey][0] : msg[subKey];
              msg = `${subVal}`;
            }

            // Detectar errores de restricción de unicidad técnica (unique constraint / conjunto único de DRF)
            if (typeof msg === 'string' && (msg.includes('conjunto único') || msg.includes('unique constraint') || msg.includes('unique set'))) {
              msg = 'No es posible registrar o mover el nicho a esta posición, ya existe un nicho creado anteriormente en esa coordenada. Por favor asigne el espacio correspondiente.';
            }

            toast.error(msg);
          } else {
            toast.error(data?.error || 'Petición incorrecta.');
          }
          break;

        case 500:
          toast.error('Error interno del servidor. Por favor intente más tarde.');
          break;
        default:
          toast.error(data?.detail || data?.error || 'Ocurrió un error en la solicitud.');
      }
    } else if (error.request) {
      toast.error('No se pudo conectar con el servidor backend (ERR_CONNECTION_REFUSED). Verifique que Django esté activo.');
    } else {
      toast.error('Error al procesar la solicitud.');
    }

    return Promise.reject(error);
  }
);

export default instance;

import axios from 'axios';
import toast from 'react-hot-toast';

// Instancia centralizada de Axios apuntando a la versión 1 de la API (/api/v1/)
const baseURL = import.meta.env.VITE_API_URL || '/api/v1/';
const instance = axios.create({
  baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
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
          if (Array.isArray(data)) {
            toast.error(typeof data[0] === 'string' ? data[0] : 'Datos inválidos en la solicitud.');
          } else if (typeof data === 'object' && data !== null) {
            // Revisar campos prioritarios como detail, error o non_field_errors
            let rawMsg = data.detail || data.error || data.mensaje || data.non_field_errors;
            let firstKey = '';

            if (!rawMsg) {
              firstKey = Object.keys(data)[0];
              rawMsg = data[firstKey];
            }

            if (Array.isArray(rawMsg)) rawMsg = rawMsg[0];
            if (typeof rawMsg === 'object' && rawMsg !== null) {
              const subKey = Object.keys(rawMsg)[0];
              const subVal = Array.isArray(rawMsg[subKey]) ? rawMsg[subKey][0] : rawMsg[subKey];
              rawMsg = `${subVal}`;
            }

            let msg = String(rawMsg || 'Petición con datos no válidos.');

            // Detectar y humanizar errores técnicos frecuentes
            if (firstKey === 'boleta_enganche' || firstKey === 'numero_boleta_banco') {
              msg = 'El número de boleta o referencia bancaria es obligatorio para pagos con depósito, transferencia o tarjeta.';
            } else if (msg.includes('conjunto único') || msg.includes('unique constraint') || msg.includes('unique set')) {
              msg = 'No es posible registrar o mover el nicho a esta posición, ya existe un nicho creado anteriormente en esa coordenada. Por favor asigne el espacio correspondiente.';
            } else if (msg.toLowerCase().includes('this field is required')) {
              msg = `El campo ${firstKey ? `"${firstKey}"` : 'requerido'} es obligatorio.`;
            } else if (msg.toLowerCase().includes('invalid pk')) {
              msg = 'El elemento o registro seleccionado no existe en el sistema.';
            }

            toast.error(msg);
          } else {
            toast.error(data?.error || 'Petición incorrecta.');
          }
          break;

        case 500:
          toast.error('Ocurrió una eventualidad en el servidor. Si el problema persiste, revise los datos de la solicitud o comuníquese con soporte.');
          break;
        default:
          toast.error(data?.detail || data?.error || 'Ocurrió un error al procesar la solicitud.');
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      toast.error('La operación está tomando más tiempo del esperado debido a la conexión con la base de datos. Por favor espere unos momentos o intente de nuevo.');
    } else if (error.request) {
      toast.error('No se pudo conectar con el servidor backend. Verifique que Django esté activo y su conexión a internet.');
    } else {
      toast.error('Error al procesar la solicitud.');
    }

    return Promise.reject(error);
  }
);

export default instance;

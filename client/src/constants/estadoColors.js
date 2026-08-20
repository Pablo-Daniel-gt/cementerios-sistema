// Mapeo centralizado de colores de interfaz de usuario para estados de espacios físicos
export const ESTADO_COLORS = {
  Disponible: '#28A745',
  Reservado: '#FFC107',
  Ocupado: '#DC3545',
  Mantenimiento: '#17A2B8',
};

export const getEstadoColor = (nombreEstado) => {
  return ESTADO_COLORS[nombreEstado] || '#6c757d';
};

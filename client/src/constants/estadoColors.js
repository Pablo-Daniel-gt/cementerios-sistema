// Mapeo centralizado de colores de interfaz de usuario empática y serena para estados de espacios físicos
export const ESTADO_COLORS = {
  Disponible: '#2E7D32',   // Verde Salvia / Esmeralda Suave
  Reservado: '#D97706',    // Ámbar Cobre Suave
  Ocupado: '#991B1B',      // Terracota / Rojo Sobrio
  Mantenimiento: '#2563EB',// Azul Acero Sereno
};

export const getEstadoColor = (nombreEstado) => {
  return ESTADO_COLORS[nombreEstado] || '#64748B';
};

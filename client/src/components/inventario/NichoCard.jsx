import React from 'react';
import { getEstadoColor } from '../../constants/estadoColors';

export function NichoCard({ espacio, onSelect }) {
  const isDisponible = espacio.estado === 'Disponible';
  const colorHex = getEstadoColor(espacio.estado);

  return (
    <div
      onClick={() => onSelect(espacio)}
      title={`${espacio.codigo_unico_espacio} | Estado: ${espacio.estado} | Precio: Q${espacio.precio_individual ? Number(espacio.precio_individual).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : 'N/A'}`}
      className={`nicho-card position-relative p-2 rounded shadow-sm transition-all ${isDisponible ? 'clickable-nicho' : 'blocked-nicho'}`}
      style={{
        backgroundColor: colorHex,
        color: '#ffffff',
        minHeight: '85px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
        border: '1px solid rgba(0,0,0,0.15)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Cabecera del Nicho */}
      <div className="d-flex justify-content-between align-items-center w-100">
        <span className="badge bg-dark bg-opacity-50 text-white rounded-pill px-2" style={{ fontSize: '0.7rem' }}>
          F{espacio.posicion_fila}-C{espacio.posicion_columna}
        </span>
        {isDisponible ? (
          <i className="bi bi-check-circle text-white opacity-75" style={{ fontSize: '0.8rem' }}></i>
        ) : (
          <i className="bi bi-lock-fill text-white opacity-75" style={{ fontSize: '0.8rem' }}></i>
        )}
      </div>

      {/* Código del Nicho */}
      <div className="text-center my-1">
        <span className="fw-bold d-block text-truncate px-1" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
          {espacio.codigo_unico_espacio}
        </span>
      </div>

      {/* Pie con Estado */}
      <div className="d-flex justify-content-center align-items-center w-100" style={{ fontSize: '0.72rem' }}>
        <span className="fw-semibold opacity-90 text-truncate">{espacio.estado}</span>
      </div>
    </div>
  );
}

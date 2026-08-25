import React, { useState } from 'react';
import { NichoCard } from './NichoCard';

export function MatrizVisual({ estructura, espacios = [], onSelectNicho }) {
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  if (!estructura) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center bg-white">
        <i className="bi bi-building text-muted display-4 mb-3"></i>
        <h5 className="text-secondary">Seleccione una Estructura Física</h5>
        {/* <p className="text-muted mb-0">Elija un sector y una estructura.</p> */}
      </div>
    );
  }

  // Filtrar espacios según el botón seleccionado
  const espaciosFiltrados = filtroEstado === 'TODOS'
    ? espacios
    : espacios.filter((e) => e.estado === filtroEstado);

  return (
    <div className="card shadow-sm border-0 bg-white mb-4">
      {/* Cabecera de la Estructura */}
      <div className="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-grid-3x3-gap-fill"></i>
            {estructura.nombre_estructura}
            <span className="badge bg-light text-primary fs-6 ms-2">
              {estructura.codigo_estructura}
            </span>
          </h5>
          <small className="opacity-90">
            Sector: <strong>{estructura.sector}</strong> ({estructura.nomenclatura_sector})
          </small>
        </div>

        <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-2 rounded">
          <div className="text-center px-2 border-end border-white border-opacity-25">
            <span className="d-block fw-bold fs-6">{estructura.total_filas}</span>
            <small className="opacity-75" style={{ fontSize: '0.75rem' }}>Filas</small>
          </div>
          <div className="text-center px-2 border-end border-white border-opacity-25">
            <span className="d-block fw-bold fs-6">{estructura.total_columnas}</span>
            <small className="opacity-75" style={{ fontSize: '0.75rem' }}>Columnas</small>
          </div>
          <div className="text-center px-2">
            <span className="d-block fw-bold fs-6">{estructura.capacidad_total_espacios}</span>
            <small className="opacity-75" style={{ fontSize: '0.75rem' }}>Total Nichos</small>
          </div>
        </div>
      </div>

      {/* Barra de Controles y Filtros */}
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <span className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-funnel-fill me-1"></i>
            Filtrar Nichos ({espaciosFiltrados.length} de {espacios.length}):
          </span>

          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${filtroEstado === 'TODOS' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFiltroEstado('TODOS')}
            >
              Todos ({espacios.length})
            </button>
            <button
              type="button"
              className={`btn ${filtroEstado === 'Disponible' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFiltroEstado('Disponible')}
            >
              Disponibles
            </button>
            <button
              type="button"
              className={`btn ${filtroEstado === 'Reservado' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
              onClick={() => setFiltroEstado('Reservado')}
            >
              Reservados
            </button>
            <button
              type="button"
              className={`btn ${filtroEstado === 'Ocupado' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFiltroEstado('Ocupado')}
            >
              Ocupados
            </button>
            <button
              type="button"
              className={`btn ${filtroEstado === 'Mantenimiento' ? 'btn-info text-white' : 'btn-outline-info'}`}
              onClick={() => setFiltroEstado('Mantenimiento')}
            >
              Mantenimiento
            </button>
          </div>
        </div>

        {/* Grilla 2D CSS Grid */}
        {espaciosFiltrados.length === 0 ? (
          <div className="alert alert-light text-center py-4 my-2 border">
            <i className="bi bi-info-circle text-muted fs-4 d-block mb-1"></i>
            No se encontraron nichos para el filtro seleccionado.
          </div>
        ) : (
          <div
            className="matriz-grid p-3 rounded"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${estructura.total_columnas}, minmax(110px, 1fr))`,
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            {espaciosFiltrados.map((espacio) => (
              <NichoCard
                key={espacio.id_espacio}
                espacio={espacio}
                onSelect={onSelectNicho}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

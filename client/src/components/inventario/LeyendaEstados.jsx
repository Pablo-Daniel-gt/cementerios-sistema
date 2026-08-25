import React from 'react';

export function LeyendaEstados({ contadores = {} }) {
  const estados = [
    {
      nombre: 'Disponible',
      hex: '#28A745',
      colorBadge: 'bg-success',
      desc: 'Seleccionable para venta',
      icon: 'bi-check-circle-fill'
    },
    {
      nombre: 'Reservado',
      hex: '#FFC107',
      colorBadge: 'bg-warning text-dark',
      desc: 'Proceso comercial activo',
      icon: 'bi-clock-history'
    },
    {
      nombre: 'Ocupado',
      hex: '#DC3545',
      colorBadge: 'bg-danger',
      desc: 'Inhumación activa',
      icon: 'bi-file-earmark-lock2-fill'
    },
    {
      nombre: 'Mantenimiento',
      hex: '#17A2B8',
      colorBadge: 'bg-info text-white',
      desc: 'Reparación / Mantenimiento',
      icon: 'bi-tools'
    },
  ];

  return (
    <div className="card shadow-sm border-0 mb-4 bg-white">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <h6 className="card-title m-0 fw-bold text-secondary d-flex align-items-center gap-2">
            <i className="bi bi-palette-fill text-primary"></i>
            Información de Estados de Nichos
          </h6>
        </div>

        <div className="row g-2">
          {estados.map((est) => {
            const count = contadores[est.nombre] ?? 0;
            return (
              <div className="col-12 col-sm-6 col-md-3" key={est.nombre}>
                <div 
                  className="d-flex align-items-center p-2 rounded border"
                  style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid ${est.hex}` }}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white shadow-sm"
                    style={{ width: '32px', height: '32px', backgroundColor: est.hex, fontSize: '0.9rem' }}
                  >
                    <i className={`bi ${est.icon}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{est.nombre}</span>
                      <span className={`badge ${est.colorBadge} rounded-pill`}>{count}</span>
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{est.desc}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

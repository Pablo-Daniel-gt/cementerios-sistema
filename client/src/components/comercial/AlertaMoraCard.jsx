import React from 'react';

/**
 * Tarjeta para visualización de Alertas de Mora por Nivel de Riesgo (RF-06)
 */
export const AlertaMoraCard = ({ alerta, onRegistrarPago }) => {
  const getBadgeRiesgo = (nivel) => {
    switch (nivel) {
      case 'PREVENTIVO':
        return <span className="badge bg-success"><i className="bi bi-shield-check me-1"></i>Preventivo (1-30 días)</span>;
      case 'OPERATIVO':
        return <span className="badge bg-warning text-dark"><i className="bi bi-telephone-outbound-fill me-1"></i>Operativo (31-90 días)</span>;
      case 'EXTRAJUDICIAL':
        return <span className="badge bg-danger"><i className="bi bi-exclamation-octagon-fill me-1"></i>Extrajudicial (&gt;90 días)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="card h-100 shadow-sm border-start border-4 border-danger">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="card-title fw-bold mb-0 text-dark">
              Contrato: {alerta.numero_contrato}
            </h6>
            <small className="text-muted">{alerta.cliente_nombre}</small>
          </div>
          {getBadgeRiesgo(alerta.nivel_riesgo)}
        </div>

        <p className="card-text mb-2 text-secondary small">
          <i className="bi bi-info-circle me-1 text-danger"></i>
          <strong>Motivo:</strong> {alerta.motivo_mora}
        </p>

        <div className="row text-center my-3 bg-light p-2 rounded">
          <div className="col-6 border-end">
            <small className="text-muted d-block">Días de Atraso</small>
            <strong className="text-danger fs-5">{alerta.dias_atraso} Días</strong>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Monto Vencido</small>
            <strong className="text-dark fs-5">
              Q{Number(alerta.monto_vencido).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <div className="small">
            <i className="bi bi-telephone me-1"></i>
            {alerta.cliente_telefono}
          </div>
          {onRegistrarPago && (
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => onRegistrarPago(alerta)}
            >
              <i className="bi bi-cash-stack me-1"></i> Cobrar en Caja
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

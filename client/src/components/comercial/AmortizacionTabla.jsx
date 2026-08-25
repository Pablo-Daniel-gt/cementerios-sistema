import React from 'react';

/**
 * Tabla de Amortización Reutilizable (RF-01)
 * Muestra el desglose de cuotas en Quetzales Guatemaltecos (Q00.00)
 */
export const AmortizacionTabla = ({ cuotas = [], showEstado = false }) => {
  if (!cuotas || cuotas.length === 0) {
    return <div className="alert alert-secondary text-center">No hay cuotas registradas en el plan.</div>;
  }

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'PAGADA':
      case 'PAGADO':
        return <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i>Pagada</span>;
      case 'VENCIDA':
      case 'EN_MORA':
        return <span className="badge bg-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i>Vencida</span>;
      case 'PARCIAL':
        return <span className="badge bg-warning text-dark"><i className="bi bi-clock-history me-1"></i>Parcial</span>;
      default:
        return <span className="badge bg-secondary"><i className="bi bi-hourglass-split me-1"></i>Pendiente</span>;
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle border text-center mb-0">
        <thead className="table-dark">
          <tr>
            <th>No. Cuota</th>
            <th>Fecha Vencimiento</th>
            <th>Monto Cuota</th>
            {cuotas[0]?.saldo_restante !== undefined && <th>Saldo Restante</th>}
            {showEstado && <th>Estado</th>}
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c, idx) => (
            <tr key={c.id_plan || c.numero_cuota || idx}>
              <td className="fw-bold">Cuota #{c.numero_cuota}</td>
              <td>{c.fecha_vencimiento}</td>
              <td className="fw-bold text-success">
                Q{Number(c.monto_cuota).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              {c.saldo_restante !== undefined && (
                <td className="text-muted">
                  Q{Number(c.saldo_restante).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              )}
              {showEstado && <td>{getBadgeEstado(c.estado_cuota)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

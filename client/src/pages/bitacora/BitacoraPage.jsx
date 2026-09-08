import { useEffect, useState } from 'react';
import { obtenerBitacora } from '../../api/cuentas.api';

export const BitacoraPage = () => {
  const [bitacora, setBitacora] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBitacora = async () => {
    setLoading(true);
    try {
      const res = await obtenerBitacora();
      if (Array.isArray(res.data)) {
        setBitacora(res.data);
      } else {
        setBitacora([]);
      }
    } catch (err) {
      console.error('Error al obtener bitacora:', err);
      setBitacora([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBitacora();
  }, []);

  const getActionBadge = (accion) => {
    switch (accion) {
      case 'INSERT':
        return <span className="badge bg-success">CREACIÓN (INSERT)</span>;
      case 'UPDATE':
        return <span className="badge bg-warning text-dark">MODIFICACIÓN (UPDATE)</span>;
      case 'DELETE':
        return <span className="badge bg-danger">ELIMINACIÓN (DELETE)</span>;
      default:
        return <span className="badge bg-secondary">{accion}</span>;
    }
  };

  const bitacoraFiltrada = bitacora.filter((item) => {
    const term = searchQuery.toLowerCase();
    const usuario = (item.usuario_username || '').toLowerCase();
    const tabla = (item.tabla_afectada || '').toLowerCase();
    const accion = (item.accion || '').toLowerCase();
    return usuario.includes(term) || tabla.includes(term) || accion.includes(term);
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Bitácora de Auditoría</h3>
          <p className="text-muted mb-0">Registro histórico e inmutable de eventos y cambios en la base de datos</p>
        </div>
        <button onClick={loadBitacora} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
          <i className="bi bi-arrow-clockwise"></i>
          <span>Actualizar Registros</span>
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Filtrar por usuario, tabla o acción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-2 text-muted">Cargando registros de auditoría...</p>
            </div>
          ) : Array.isArray(bitacoraFiltrada) && bitacoraFiltrada.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario Ejecutor</th>
                    <th>Tabla Afectada</th>
                    <th>Acción</th>
                    <th className="text-center">Detalle Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacoraFiltrada.map((item) => (
                    <tr key={item.id}>
                      <td className="small fw-semibold text-muted">
                        {new Date(item.fecha_hora).toLocaleString('es-GT')}
                      </td>
                      <td className="fw-bold text-dark">
                        <i className="bi bi-person me-1 text-primary"></i>
                        {item.usuario_username || <span className="text-muted italic">Sistema</span>}
                      </td>
                      <td className="font-monospace text-primary">{item.tabla_afectada}</td>
                      <td>{getActionBadge(item.accion)}</td>
                      <td className="text-center">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="btn btn-sm btn-outline-info"
                          data-bs-toggle="modal"
                          data-bs-target="#jsonModal"
                        >
                          <i className="bi bi-eye me-1"></i> Ver JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x fs-1 d-block mb-2"></i>
              <span>No se encontraron eventos en la bitácora.</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal para visualizar Snapshots JSON pre/post cambio */}
      <div className="modal fade" id="jsonModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title fw-bold fs-6">
                <i className="bi bi-code-square me-2 text-info"></i>
                Detalle de Auditoría - Evento #{selectedRecord?.id}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {selectedRecord && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-danger">Datos Anteriores (Pre-Cambio)</h6>
                    <pre className="bg-light p-3 rounded border text-wrap text-break small" style={{ maxHeight: '300px' }}>
                      {selectedRecord.datos_anteriores
                        ? JSON.stringify(selectedRecord.datos_anteriores, null, 2)
                        : 'Sin datos previos'}
                    </pre>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-success">Datos Nuevos (Post-Cambio)</h6>
                    <pre className="bg-light p-3 rounded border text-wrap text-break small" style={{ maxHeight: '300px' }}>
                      {selectedRecord.datos_nuevos
                        ? JSON.stringify(selectedRecord.datos_nuevos, null, 2)
                        : 'Sin datos nuevos'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

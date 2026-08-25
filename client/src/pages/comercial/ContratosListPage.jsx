import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getContratos } from '../../api/comercial.api';
import { EstadoCuentaModal } from '../../components/comercial/EstadoCuentaModal';
import { ReciboFormModal } from '../../components/comercial/ReciboFormModal';

/**
 * Vista Listado General de Contratos Comerciales
 */
export const ContratosListPage = () => {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [contratoEstadoCuentaId, setContratoEstadoCuentaId] = useState(null);
  const [showEstadoCuentaModal, setShowEstadoCuentaModal] = useState(false);

  const [contratoRecibo, setContratoRecibo] = useState(null);
  const [showReciboModal, setShowReciboModal] = useState(false);

  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarContratos = async () => {
    setLoading(true);
    try {
      const res = await getContratos();
      setContratos(res.data || []);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('No se pudo cargar la lista de contratos');
    } finally {
      setLoading(false);
    }
  };

  const contratosFiltrados = contratos.filter((c) => {
    const term = busqueda.toLowerCase();
    return (
      c.numero_contrato?.toLowerCase().includes(term) ||
      c.cliente_nombre?.toLowerCase().includes(term) ||
      c.modalidad_nombre?.toLowerCase().includes(term)
    );
  });

  const handleVerEstadoCuenta = (id) => {
    setContratoEstadoCuentaId(id);
    setShowEstadoCuentaModal(true);
  };

  const handleCobrarCaja = (contratoObj) => {
    setContratoRecibo(contratoObj);
    setShowReciboModal(true);
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-file-earmark-text-fill text-primary me-2"></i>
            Gestión de Contratos Comerciales
          </h2>
          <small className="text-muted">
            Administración de acuerdos de derechos de uso a perpetuidad y control financiero
          </small>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/comercial/contratos/nuevo')}
        >
          <i className="bi bi-plus-circle-fill me-1"></i> Nuevo Contrato
        </button>
      </div>

      {/* Buscador */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por número de contrato, nombre de cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Contratos */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Cargando expediente comercial...</p>
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox display-4 mb-2 d-block"></i>
              No se encontraron contratos registrados.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>No. Contrato</th>
                    <th>Cliente / Titular</th>
                    <th>Modalidad Venta</th>
                    <th>Precio Total (Q)</th>
                    <th>Enganche (Q)</th>
                    <th>Financiar (Q)</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contratosFiltrados.map((c) => (
                    <tr key={c.id_contrato}>
                      <td className="fw-bold text-primary">{c.numero_contrato}</td>
                      <td>{c.cliente_nombre}</td>
                      <td>{c.modalidad_nombre}</td>
                      <td className="fw-bold">
                        Q{Number(c.monto_total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-info">
                        Q{Number(c.monto_enganche).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-danger fw-bold">
                        Q{Number(c.monto_financiar).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className="badge bg-success">{c.estado_nombre}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-info"
                            title="Estado de Cuenta"
                            onClick={() => handleVerEstadoCuenta(c.id_contrato)}
                          >
                            <i className="bi bi-file-earmark-medical-fill me-1"></i> Estado Cuenta
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="Cobrar en Caja"
                            onClick={() => handleCobrarCaja(c)}
                          >
                            <i className="bi bi-cash-stack me-1"></i> Recibo Caja
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Estado de Cuenta */}
      <EstadoCuentaModal
        show={showEstadoCuentaModal}
        contratoId={contratoEstadoCuentaId}
        onClose={() => setShowEstadoCuentaModal(false)}
      />

      {/* Modal de Recibo de Caja */}
      <ReciboFormModal
        show={showReciboModal}
        contrato={contratoRecibo}
        onClose={() => setShowReciboModal(false)}
        onSuccess={cargarContratos}
      />
    </div>
  );
};

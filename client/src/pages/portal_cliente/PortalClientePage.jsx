import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerMiCliente } from '../../api/cuentas.api';
import { getContratos } from '../../api/comercial.api';
import { EstadoCuentaModal } from '../../components/comercial/EstadoCuentaModal';
import toast from 'react-hot-toast';

import { Link } from 'react-router-dom';

export const PortalClientePage = () => {
  const { user } = useAuth();
  const [clienteInfo, setClienteInfo] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [selectedContratoId, setSelectedContratoId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadClienteYContratos = async () => {
      setLoading(true);
      try {
        // Carga exclusiva y segura del perfil del cliente autenticado (RF-03)
        const resCliente = await obtenerMiCliente();
        const cliente = resCliente.data;
        setClienteInfo(cliente);

        if (cliente?.id) {
          setLoadingContratos(true);
          try {
            const resContratos = await getContratos({ cliente: cliente.id });
            setContratos(resContratos.data || []);
          } catch (errContratos) {
            console.error('Error al cargar contratos del cliente:', errContratos);
          } finally {
            setLoadingContratos(false);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del titular:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClienteYContratos();
  }, [user]);

  const handleVerEstadoCuenta = (contratoId) => {
    setSelectedContratoId(contratoId);
    setShowModal(true);
  };

  return (
    <div>
      {/* Encabezado Principal */}
      <div className="bg-primary text-white p-4 rounded-3 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary p-3 rounded-circle shadow-sm">
              <i className="bi bi-person-workspace fs-2"></i>
            </div>
            <div>
              <h3 className="fw-bold mb-1">Portal del Cliente Propietario</h3>
              <p className="mb-0 text-white-50">
                Bienvenido(a), <span className="text-white fw-semibold">{user?.first_name || user?.username}</span>
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
            title="Volver a la página de inicio del cementerio"
          >
            <i className="bi bi-globe text-warning"></i>
            <span>Volver al Sitio Web</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando su información personal y contratos...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Información del Perfil Titular */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-person-vcard me-2 text-primary"></i>
                  Datos del Titular
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">CUI / DPI:</span>
                    <span className="fw-bold text-dark">{clienteInfo?.cui || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Nombre Completo:</span>
                    <span className="fw-semibold">
                      {clienteInfo ? `${clienteInfo.nombres} ${clienteInfo.apellidos}` : `${user?.first_name || ''} ${user?.last_name || ''}`}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Teléfono:</span>
                    <span>{clienteInfo?.telefono || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Correo Electrónico:</span>
                    <span>{clienteInfo?.correo || user?.email || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2 border-0">
                    <span className="text-muted">Dirección:</span>
                    <span>{clienteInfo?.direccion || 'No registrada'}</span>
                  </li>
                </ul>
              </div>
              <div className="card-footer bg-light border-0 py-3 text-center">
                <small className="text-muted">
                  <i className="bi bi-shield-check text-success me-1"></i>
                  Identidad verificada en el camposanto
                </small>
              </div>
            </div>
          </div>

          {/* Listado de Contratos y Estado de Cuenta (RF-03) */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                  Mis Contratos y Derechos de Perpetuidad
                </h5>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {contratos.length} {contratos.length === 1 ? 'Contrato' : 'Contratos'}
                </span>
              </div>
              <div className="card-body">
                {loadingContratos ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="text-muted">Cargando contratos activos...</span>
                  </div>
                ) : contratos.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {contratos.map((c) => (
                      <div key={c.id_contrato} className="card border border-light-subtle shadow-sm">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                          <span className="fw-bold text-dark">
                            <i className="bi bi-file-earmark-check me-2 text-primary"></i>
                            Contrato {c.numero_contrato}
                          </span>
                          <span className="badge bg-success">{c.estado_contrato_nombre || 'Activo'}</span>
                        </div>
                        <div className="card-body">
                          <div className="row g-3 align-items-center">
                            <div className="col-md-4">
                              <small className="text-muted d-block">Modalidad:</small>
                              <strong className="text-secondary">{c.modalidad_nombre || 'Contado / Crédito'}</strong>
                            </div>
                            <div className="col-md-4">
                              <small className="text-muted d-block">Monto Total:</small>
                              <strong className="text-dark fs-6">
                                Q{Number(c.monto_total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                            <div className="col-md-4 text-md-end">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleVerEstadoCuenta(c.id_contrato)}
                              >
                                <i className="bi bi-journal-text me-1"></i>
                                Ver Estado de Cuenta
                              </button>
                            </div>
                          </div>

                          {c.detalles_espacio && c.detalles_espacio.length > 0 && (
                            <div className="mt-3 pt-2 border-top">
                              <small className="text-muted d-block mb-1">Espacios Físicos Asignados:</small>
                              <div className="d-flex flex-wrap gap-2">
                                {c.detalles_espacio.map((det) => (
                                  <span key={det.id_detalle} className="badge bg-secondary-subtle text-secondary border">
                                    <i className="bi bi-geo-alt-fill me-1 text-primary"></i>
                                    {det.espacio_codigo || `Espacio #${det.espacio}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-folder2-open fs-1 text-secondary mb-2 d-block"></i>
                    <h6 className="fw-semibold">No tiene contratos comerciales registrados aún</h6>
                    <p className="small mb-0">
                      Cuando adquiera un derecho de uso o nicho en el camposanto, su contrato y plan de pagos aparecerán aquí automáticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Estado de Cuenta Consolidado */}
      <EstadoCuentaModal
        show={showModal}
        contratoId={selectedContratoId}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

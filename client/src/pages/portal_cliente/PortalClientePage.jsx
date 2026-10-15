import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerMiCliente } from '../../api/cuentas.api';
import { getContratos } from '../../api/comercial.api';
import { getMisDifuntos } from '../../api/inhumaciones.api';
import { EstadoCuentaModal } from '../../components/comercial/EstadoCuentaModal';
import toast from 'react-hot-toast';

import { Link } from 'react-router-dom';

export const PortalClientePage = () => {
  const { user } = useAuth();
  const [clienteInfo, setClienteInfo] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [difuntos, setDifuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [loadingDifuntos, setLoadingDifuntos] = useState(false);
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
          setLoadingDifuntos(true);
          try {
            const [resContratos, resDifuntos] = await Promise.all([
              getContratos({ cliente: cliente.id }),
              getMisDifuntos()
            ]);
            setContratos(resContratos.data || []);
            setDifuntos(resDifuntos.data || []);
          } catch (errDatos) {
            console.error('Error al cargar datos del cliente:', errDatos);
          } finally {
            setLoadingContratos(false);
            setLoadingDifuntos(false);
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

            {/* Listado de Difuntos en Nichos / Contratos (Módulo Familiar - Solo Lectura) */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-people-fill me-2 text-primary"></i>
                    Difuntos Registrados en Mis Nichos y Contratos
                  </h5>
                  <small className="text-muted">
                    Consulta conmemorativa exclusiva de seres queridos inhumados bajo sus derechos de uso
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                    <i className="bi bi-eye me-1"></i> Modo Solo Lectura
                  </span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {difuntos.length} {difuntos.length === 1 ? 'Registro' : 'Registros'}
                  </span>
                  <Link
                    to="/portal-cliente/difuntos"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    title="Ver página completa de difuntos"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    <span>Ver página completa</span>
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {loadingDifuntos ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="text-muted">Cargando difuntos asociados a sus contratos...</span>
                  </div>
                ) : difuntos.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {difuntos.map((d) => (
                      <div key={d.id_registro} className="card border border-light-subtle shadow-sm">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center py-2 flex-wrap gap-2">
                          <div>
                            <span className="fw-bold text-dark fs-6">
                              <i className="bi bi-person-circle me-2 text-primary"></i>
                              {d.nombre_completo}
                            </span>
                            <small className="text-muted ms-2">
                              (DPI/CUI: <strong>{d.cui}</strong>)
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${d.estado_inhumacion === 'ACTIVA' ? 'bg-success' : 'bg-secondary'}`}>
                              Inhumación {d.estado_inhumacion_display || d.estado_inhumacion}
                            </span>
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <small className="text-muted d-block">Ubicación / Nicho:</small>
                              <strong className="text-primary d-block">
                                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                Nicho {d.codigo_nicho}
                              </strong>
                              <small className="text-secondary">
                                {d.sector_nombre} — {d.estructura_nombre} ({d.posicion})
                              </small>
                            </div>

                            <div className="col-md-4">
                              <small className="text-muted d-block">Fecha de Sepelio:</small>
                              <strong className="text-dark d-block">
                                <i className="bi bi-calendar-event me-1 text-info"></i>
                                {d.fecha_sepelio}
                              </strong>
                              <small className="text-muted">
                                Defunción: {d.fecha_defuncion}
                              </small>
                            </div>

                            <div className="col-md-4">
                              <small className="text-muted d-block">Contrato Titular Asociado:</small>
                              <strong className="text-secondary d-block">
                                <i className="bi bi-file-earmark-check me-1 text-success"></i>
                                Contrato {d.numero_contrato}
                              </strong>
                              <small className="text-muted">
                                Causa: {d.causa_muerte}
                              </small>
                            </div>
                          </div>

                          {d.observaciones && (
                            <div className="mt-3 pt-2 border-top">
                              <small className="text-muted d-block mb-1">Notas / Observaciones Oficiales:</small>
                              <p className="small text-secondary mb-0 bg-light p-2 rounded border">
                                {d.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="card-footer bg-white border-top py-2 d-flex justify-content-between align-items-center">
                          <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                            <i className="bi bi-shield-check text-success me-1"></i>
                            Registro de inhumación verificado legalmente ante RENAP y MSPAS
                          </small>
                          <small className="text-muted fst-italic" style={{ fontSize: '0.78rem' }}>
                            Información confidencial de uso exclusivo del titular
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-heart-pulse fs-1 text-secondary mb-2 d-block"></i>
                    <h6 className="fw-semibold">No tiene difuntos registrados en sus nichos actualmente</h6>
                    <p className="small mb-0">
                      Cuando se realice una inhumación oficial en alguno de sus nichos o contratos, la información memorial aparecerá aquí de forma automática y privada para su consulta.
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

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getEstadoCuenta } from '../../api/comercial.api';
import { AmortizacionTabla } from './AmortizacionTabla';

/**
 * Modal de Estado de Cuenta Consolidado del Contrato
 */
export const EstadoCuentaModal = ({ show, contratoId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    if (show && contratoId) {
      cargarEstadoCuenta();
    }
  }, [show, contratoId]);

  const cargarEstadoCuenta = async () => {
    setLoading(true);
    try {
      const res = await getEstadoCuenta(contratoId);
      setData(res.data);
    } catch (error) {
      console.error('Error al cargar estado de cuenta:', error);
      toast.error('No se pudo obtener el estado de cuenta del contrato');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">
              <i className="bi bi-journal-text me-2"></i>
              Estado de Cuenta Consolidado - Contrato {data?.numero_contrato || ''}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Cargando estado de cuenta consolidado...</p>
              </div>
            ) : data ? (
              <>
                {/* Cabecera del Cliente */}
                <div className="card mb-3 border-secondary">
                  <div className="card-body bg-light">
                    <div className="row">
                      <div className="col-md-4">
                        <small className="text-muted d-block">Titular del Contrato:</small>
                        <strong className="fs-6">{data.cliente}</strong>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Modalidad de Venta:</small>
                        <span>{data.modalidad}</span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Estado Contrato:</small>
                        <span className="badge bg-primary">{data.estado}</span>
                      </div>
                      <div className="col-md-2 text-end">
                        <small className="text-muted d-block">Espacios Adquiridos:</small>
                        <span className="badge bg-dark">{data.espacios_adquiridos?.length || 0} Inmuebles</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navegación por Pestañas */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'resumen' ? 'active fw-bold' : ''}`}
                      onClick={() => setActiveTab('resumen')}
                    >
                      <i className="bi bi-pie-chart-fill me-1"></i> Resumen de Saldos
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'cuotas' ? 'active fw-bold' : ''}`}
                      onClick={() => setActiveTab('cuotas')}
                    >
                      <i className="bi bi-calendar3 me-1"></i> Plan de Amortización ({data.resumen_financiero?.cuotas_totales})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'mantenimientos' ? 'active fw-bold' : ''}`}
                      onClick={() => setActiveTab('mantenimientos')}
                    >
                      <i className="bi bi-wrench-adjustable me-1"></i> Mantenimiento Anual
                    </button>
                  </li>
                </ul>

                {/* Contenido Pestañas */}
                {activeTab === 'resumen' && (
                  <div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="p-3 border rounded text-center bg-light">
                          <small className="text-muted d-block">Monto Total Contrato</small>
                          <strong className="fs-5 text-dark">
                            Q{data.resumen_financiero?.monto_total_contrato?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 border rounded text-center bg-light">
                          <small className="text-muted d-block">Enganche Aportado</small>
                          <strong className="fs-5 text-info">
                            Q{data.resumen_financiero?.monto_enganche?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </strong>
                          {data.resumen_financiero?.monto_enganche_pagado > 0 ? (
                            <small className="text-success d-block fw-bold mt-1">
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Pagado en Caja (Q{data.resumen_financiero?.monto_enganche_pagado?.toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                            </small>
                          ) : (
                            <small className="text-warning d-block fw-bold mt-1">
                              <i className="bi bi-clock-history me-1"></i>
                              Pendiente de Pago
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 border rounded text-center bg-light">
                          <small className="text-muted d-block">Amortizado a Crédito</small>
                          <strong className="fs-5 text-success">
                            Q{data.resumen_financiero?.monto_pagado_credito?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 border rounded text-center bg-danger bg-opacity-10 border-danger">
                          <small className="text-muted d-block">Saldo Deudor Pendiente</small>
                          <strong className="fs-4 text-danger">
                            Q{data.resumen_financiero?.saldo_credito_pendiente?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold">Espacios Fisicos Asignados en este Contrato:</h6>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle">
                        <thead className="table-secondary">
                          <tr>
                            <th>Código Nicho</th>
                            <th>Estructura</th>
                            <th>Sector</th>
                            <th>Precio Unitario Venta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.espacios_adquiridos?.map((esp) => (
                            <tr key={esp.id_espacio}>
                              <td className="fw-bold">{esp.codigo_unico_espacio}</td>
                              <td>{esp.estructura}</td>
                              <td>{esp.sector}</td>
                              <td>Q{esp.precio_unitario?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'cuotas' && (
                  <AmortizacionTabla cuotas={data.plan_cuotas} showEstado={true} />
                )}

                {activeTab === 'mantenimientos' && (
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered align-middle text-center">
                      <thead className="table-dark">
                        <tr>
                          <th>Año Período</th>
                          <th>Monto Mantenimiento</th>
                          <th>Fecha Límite Pago</th>
                          <th>Fecha Pago Real</th>
                          <th>Estado Cobro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.control_mantenimientos?.map((m) => (
                          <tr key={m.id_control_mante}>
                            <td className="fw-bold">{m.anio_periodo}</td>
                            <td className="fw-bold text-success">
                              Q{Number(m.monto_mantenimiento).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                            </td>
                            <td>{m.fecha_limite_pago}</td>
                            <td>{m.fecha_pago_real || '—'}</td>
                            <td>
                              {m.estado_cobro === 'PAGADO' ? (
                                <span className="badge bg-success">Pagado</span>
                              ) : m.estado_cobro === 'EN_MORA' ? (
                                <span className="badge bg-danger">En Mora</span>
                              ) : (
                                <span className="badge bg-secondary">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

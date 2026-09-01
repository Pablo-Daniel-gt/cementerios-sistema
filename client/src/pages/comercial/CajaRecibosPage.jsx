import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getRecibos, updateRecibo, descargarReciboPDF } from '../../api/comercial.api';

/**
 * Vista de Caja y Recibos de Pago (Módulo C)
 * Permite visualizar, imprimir en PDF y editar transacciones de caja.
 */
export const CajaRecibosPage = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [reciboVer, setReciboVer] = useState(null);
  const [reciboEditar, setReciboEditar] = useState(null);

  useEffect(() => {
    cargarRecibos();
  }, []);

  const cargarRecibos = async () => {
    setLoading(true);
    try {
      const res = await getRecibos();
      setRecibos(res.data || []);
    } catch (error) {
      console.error('Error al cargar recibos:', error);
      toast.error('No se pudieron obtener los recibos de caja');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirPDF = async (idRecibo) => {
    const toastId = toast.loading('Generando recibo PDF...');
    try {
      const response = await descargarReciboPDF(idRecibo);
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      toast.success('Recibo PDF generado.', { id: toastId });
    } catch (error) {
      console.error('Error al descargar PDF de recibo:', error);
      toast.error('No se pudo generar el documento PDF del recibo.', { id: toastId });
    }
  };

  const recibosFiltrados = recibos.filter((r) => {
    const term = busqueda.toLowerCase();
    return (
      String(r.correlativo_recibo).includes(term) ||
      r.contrato_numero?.toLowerCase().includes(term) ||
      r.metodo_pago?.toLowerCase().includes(term)
    );
  });

  const totalIngresado = recibosFiltrados.reduce((sum, r) => sum + parseFloat(r.monto_ingresado || 0), 0);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-cash-register text-success me-2"></i>
            Control de Caja y Recibos de Pago
          </h2>
          <small className="text-muted">
            Historial de cobros financieros emitidos y recaudación en Quetzales (Q00.00)
          </small>
        </div>
      </div>

      {/* Tarjeta de Resumen Financiero */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 bg-success bg-opacity-10 border-start border-4 border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted d-block uppercase fw-bold">Total Recaudación en Caja</small>
                  <strong className="fs-3 text-success">
                    Q{totalIngresado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <i className="bi bi-wallet2 display-5 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border-0 bg-primary bg-opacity-10 border-start border-4 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted d-block uppercase fw-bold">Total Recibos Emitidos</small>
                  <strong className="fs-3 text-primary">{recibosFiltrados.length} Transacciones</strong>
                </div>
                <i className="bi bi-receipt-cutoff display-5 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por no. correlativo de recibo, contrato o método de pago..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Recibos */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2 text-muted">Cargando recibos de caja...</p>
            </div>
          ) : recibosFiltrados.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x display-4 mb-2 d-block"></i>
              No hay recibos registrados en caja.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>No. Recibo</th>
                    <th>No. Contrato</th>
                    <th>Cajero / Operador</th>
                    <th>Fecha y Hora</th>
                    <th>Método de Pago</th>
                    <th>Boleta / Ref.</th>
                    <th>Monto Ingresado (Q)</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recibosFiltrados.map((r) => (
                    <tr key={r.id_recibo}>
                      <td className="fw-bold text-success">#{r.correlativo_recibo}</td>
                      <td className="fw-bold">{r.contrato_numero}</td>
                      <td>{r.usuario_cajero_nombre || 'Cajero Sistema'}</td>
                      <td>{new Date(r.fecha_transaccion).toLocaleString('es-GT')}</td>
                      <td>
                        <span className="badge bg-secondary">{r.metodo_pago}</span>
                      </td>
                      <td>{r.numero_boleta_banco || '—'}</td>
                      <td className="fw-bold text-success">
                        Q{Number(r.monto_ingresado).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-info"
                            title="Ver Detalle Completo"
                            onClick={() => setReciboVer(r)}
                          >
                            <i className="bi bi-eye-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Imprimir Recibo PDF"
                            onClick={() => handleImprimirPDF(r.id_recibo)}
                          >
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Editar Método/Ref. de Pago"
                            onClick={() => setReciboEditar(r)}
                          >
                            <i className="bi bi-pencil-fill"></i>
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

      {/* MODAL VER DETALLE RECIBO */}
      {reciboVer && (
        <VerReciboModal
          recibo={reciboVer}
          onClose={() => setReciboVer(null)}
          onPrint={handleImprimirPDF}
        />
      )}

      {/* MODAL EDITAR RECIBO */}
      {reciboEditar && (
        <EditarReciboModal
          recibo={reciboEditar}
          onClose={() => setReciboEditar(null)}
          onSuccess={cargarRecibos}
        />
      )}
    </div>
  );
};

// COMPONENTE MODAL VER DETALLE RECIBO
const VerReciboModal = ({ recibo, onClose, onPrint }) => {
  if (!recibo) return null;

  const detallesCredito = (recibo.detalles || []).filter((d) => d.concepto === 'CUOTA_AMORTIZACION');
  const detallesEnganche = (recibo.detalles || []).filter((d) => d.concepto === 'ENGANCHE');
  const detallesMante = (recibo.detalles || []).filter((d) => d.concepto === 'MANTENIMIENTO_ANUAL');

  const montoCredito = detallesCredito.reduce((sum, d) => sum + parseFloat(d.monto_aplicado || 0), 0);
  const cuotasCanceladas = detallesCredito.filter((d) => d.plan_cuota).length;

  const montoEnganche = detallesEnganche.reduce((sum, d) => sum + parseFloat(d.monto_aplicado || 0), 0);
  const montoMante = detallesMante.reduce((sum, d) => sum + parseFloat(d.monto_aplicado || 0), 0);

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-receipt-cutoff me-2 text-success"></i>
              Comprobante de Caja - Recibo #{recibo.correlativo_recibo}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="row g-3 mb-3 border-bottom pb-3">
              <div className="col-md-6">
                <small className="text-muted d-block">Número de Contrato:</small>
                <strong className="fs-6 text-primary">{recibo.contrato_numero}</strong>
              </div>
              <div className="col-md-6 text-md-end">
                <small className="text-muted d-block">Fecha y Hora de Transacción:</small>
                <strong>{new Date(recibo.fecha_transaccion).toLocaleString('es-GT')}</strong>
              </div>
              <div className="col-md-6">
                <small className="text-muted d-block">Cajero / Operador:</small>
                <span>{recibo.usuario_cajero_nombre || 'Caja General'}</span>
              </div>
              <div className="col-md-6 text-md-end">
                <small className="text-muted d-block">Método de Pago:</small>
                <span className="badge bg-success">{recibo.metodo_pago}</span>
                {recibo.numero_boleta_banco && (
                  <span className="d-block small text-muted">Ref: {recibo.numero_boleta_banco}</span>
                )}
              </div>
            </div>

            <h6 className="fw-bold mb-2 text-secondary">Resumen de Conceptos Aplicados:</h6>
            <div className="table-responsive mb-3">
              <table className="table table-bordered table-sm align-middle mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th>Concepto</th>
                    <th>Resumen / Cuotas Canceladas</th>
                    <th className="text-end">Monto Aplicado (Q)</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesCredito.length > 0 && (
                    <tr>
                      <td className="fw-bold">Cuota de Amortización Crédito</td>
                      <td>
                        {cuotasCanceladas > 0
                          ? `${cuotasCanceladas} cuota(s) cancelada(s) con este pago`
                          : 'Abono parcial a cuota'}
                      </td>
                      <td className="text-end fw-bold text-success">
                        Q{montoCredito.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {detallesEnganche.length > 0 && (
                    <tr>
                      <td className="fw-bold">Enganche Inicial</td>
                      <td>Enganche Inicial del Contrato</td>
                      <td className="text-end fw-bold text-success">
                        Q{montoEnganche.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {detallesMante.length > 0 && (
                    <tr>
                      <td className="fw-bold">Mantenimiento Anual</td>
                      <td>Mantenimiento Anual Camposanto</td>
                      <td className="text-end fw-bold text-success">
                        Q{montoMante.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {(!recibo.detalles || recibo.detalles.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-2">
                        Cobro directo abonado a saldo de contrato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded border">
              <span className="fw-bold text-secondary">Monto Total Ingresado:</span>
              <span className="fs-4 fw-bold text-success">
                Q{Number(recibo.monto_ingresado).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {recibo.observaciones && (
              <div className="mt-3">
                <small className="text-muted d-block">Observaciones / Notas:</small>
                <p className="small text-dark mb-0 bg-white p-2 border rounded">{recibo.observaciones}</p>
              </div>
            )}
          </div>
          <div className="modal-footer bg-light d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => onPrint(recibo.id_recibo)}
            >
              <i className="bi bi-file-earmark-pdf-fill me-1"></i> Imprimir Recibo PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE MODAL EDITAR RECIBO
const EditarReciboModal = ({ recibo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    monto_ingresado: recibo.monto_ingresado || '',
    metodo_pago: recibo.metodo_pago || 'EFECTIVO',
    numero_boleta_banco: recibo.numero_boleta_banco || '',
    observaciones: recibo.observaciones || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto_ingresado || parseFloat(formData.monto_ingresado) <= 0) {
      toast.error('Ingrese un monto de cobro válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        monto_ingresado: parseFloat(formData.monto_ingresado)
      };
      await updateRecibo(recibo.id_recibo, payload);
      toast.success(`Recibo #${recibo.correlativo_recibo} actualizado correctamente.`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar recibo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-pencil-square me-2"></i>
              Editar Transacción - Recibo #{recibo.correlativo_recibo}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Monto Ingresado */}
              <div className="mb-3">
                <label className="form-label fw-bold">Monto Ingresado (Q) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control fw-bold text-success fs-5"
                  placeholder="Ej. 1000.00"
                  value={formData.monto_ingresado}
                  onChange={(e) => setFormData({ ...formData, monto_ingresado: e.target.value })}
                  required
                />
                <small className="text-muted">Si modifica el monto del recibo, la amortización del contrato se recalculará automáticamente.</small>
              </div>

              {/* Método de Pago */}
              <div className="mb-3">
                <label className="form-label fw-bold">Método de Pago:</label>
                <select
                  className="form-select"
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  required
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DEPOSITO_BANCO">Depósito Bancario</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA">Tarjeta de Crédito / Débito</option>
                </select>
              </div>

              {/* No. Boleta / Referencia */}
              {formData.metodo_pago !== 'EFECTIVO' && (
                <div className="mb-3">
                  <label className="form-label fw-bold">No. Boleta / Referencia Bancaria *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Depósito #98765432"
                    value={formData.numero_boleta_banco}
                    onChange={(e) => setFormData({ ...formData, numero_boleta_banco: e.target.value })}
                    required={formData.metodo_pago !== 'EFECTIVO'}
                  />
                </div>
              )}

              {/* Observaciones */}
              <div className="mb-3">
                <label className="form-label fw-bold">Observaciones / Notas de Transacción:</label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Detalles o aclaraciones sobre el cobro realizado..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-1"></span> : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

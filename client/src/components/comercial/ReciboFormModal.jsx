import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createRecibo, getPlanCuotas, getControlMantenimientos } from '../../api/comercial.api';

/**
 * Modal para Generación y Registro de Recibos de Caja
 */
export const ReciboFormModal = ({ show, contrato, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    metodo_pago: 'EFECTIVO',
    numero_boleta_banco: '',
    observaciones: ''
  });
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState('CUOTA_AMORTIZACION');
  const [cuotasPendientes, setCuotasPendientes] = useState([]);
  const [mantenimientosPendientes, setMantenimientosPendientes] = useState([]);
  const [cuotaIdSeleccionada, setCuotaIdSeleccionada] = useState('');
  const [manteIdSeleccionado, setManteIdSeleccionado] = useState('');
  const [montoIngresado, setMontoIngresado] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && contrato) {
      cargarPendientes();
    }
  }, [show, contrato]);

  const cargarPendientes = async () => {
    try {
      const resCuotas = await getPlanCuotas({ contrato: contrato.id_contrato });
      const cuotasNoPagadas = (resCuotas.data || []).filter((c) => c.estado_cuota !== 'PAGADA');
      setCuotasPendientes(cuotasNoPagadas);
      if (cuotasNoPagadas.length > 0) {
        setCuotaIdSeleccionada(cuotasNoPagadas[0].id_plan);
        setMontoIngresado(cuotasNoPagadas[0].monto_cuota);
      }

      const resMante = await getControlMantenimientos({ contrato: contrato.id_contrato });
      const mantesNoPagados = (resMante.data || []).filter((m) => m.estado_cobro !== 'PAGADO');
      setMantenimientosPendientes(mantesNoPagados);
      if (mantesNoPagados.length > 0 && conceptoSeleccionado === 'MANTENIMIENTO_ANUAL') {
        setManteIdSeleccionado(mantesNoPagados[0].id_control_mante);
      }
    } catch (error) {
      console.error('Error al cargar pendientes:', error);
    }
  };

  if (!show || !contrato) return null;

  const handleConceptoChange = (e) => {
    const val = e.target.value;
    setConceptoSeleccionado(val);
    if (val === 'CUOTA_AMORTIZACION' && cuotasPendientes.length > 0) {
      setMontoIngresado(cuotasPendientes[0].monto_cuota);
    } else if (val === 'MANTENIMIENTO_ANUAL' && mantenimientosPendientes.length > 0) {
      setMontoIngresado(mantenimientosPendientes[0].monto_mantenimiento);
    } else if (val === 'ENGANCHE') {
      setMontoIngresado(contrato.monto_enganche);
    }
  };

  const handleCuotaChange = (e) => {
    const id = e.target.value;
    setCuotaIdSeleccionada(id);
    const selected = cuotasPendientes.find((c) => String(c.id_plan) === String(id));
    if (selected) {
      setMontoIngresado(selected.monto_cuota);
    }
  };

  const handleManteChange = (e) => {
    const id = e.target.value;
    setManteIdSeleccionado(id);
    const selected = mantenimientosPendientes.find((m) => String(m.id_control_mante) === String(id));
    if (selected) {
      setMontoIngresado(selected.monto_mantenimiento);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montoIngresado || parseFloat(montoIngresado) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      const planCuotaId = (conceptoSeleccionado === 'CUOTA_AMORTIZACION' && cuotaIdSeleccionada) ? parseInt(cuotaIdSeleccionada, 10) : null;
      const controlManteId = (conceptoSeleccionado === 'MANTENIMIENTO_ANUAL' && manteIdSeleccionado) ? parseInt(manteIdSeleccionado, 10) : null;

      const detalleObj = {
        concepto: conceptoSeleccionado,
        monto_aplicado: parseFloat(montoIngresado),
        plan_cuota: isNaN(planCuotaId) ? null : planCuotaId,
        control_mantenimiento: isNaN(controlManteId) ? null : controlManteId
      };


      const payload = {
        contrato: contrato.id_contrato,
        monto_ingresado: parseFloat(montoIngresado),
        metodo_pago: formData.metodo_pago,
        numero_boleta_banco: formData.numero_boleta_banco || null,
        observaciones: formData.observaciones || null,
        detalles: [detalleObj]
      };

      await createRecibo(payload);
      toast.success('Recibo de caja registrado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al registrar recibo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-receipt-cutoff me-2"></i>
              Cobro en Caja - Recibo de Pago
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-light border mb-3">
                <small className="text-muted d-block">Contrato Maestro:</small>
                <strong>{contrato.numero_contrato} - {contrato.cliente_nombre}</strong>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Concepto de Cobro:</label>
                <select
                  className="form-select"
                  value={conceptoSeleccionado}
                  onChange={handleConceptoChange}
                >
                  <option value="CUOTA_AMORTIZACION">Cuota de Amortización Crédito</option>
                  <option value="MANTENIMIENTO_ANUAL">Mantenimiento Anual Camposanto</option>
                  <option value="ENGANCHE">Enganche Inicial</option>
                  <option value="OTRO">Otro Concepto</option>
                </select>
              </div>

              {conceptoSeleccionado === 'CUOTA_AMORTIZACION' && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Seleccionar Cuota Pendiente:</label>
                  <select
                    className="form-select"
                    value={cuotaIdSeleccionada}
                    onChange={handleCuotaChange}
                    required
                  >
                    {cuotasPendientes.map((c) => (
                      <option key={c.id_plan} value={c.id_plan}>
                        Cuota #{c.numero_cuota} (Vence: {c.fecha_vencimiento}) - Q{c.monto_cuota}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {conceptoSeleccionado === 'MANTENIMIENTO_ANUAL' && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Seleccionar Mantenimiento Pendiente:</label>
                  <select
                    className="form-select"
                    value={manteIdSeleccionado}
                    onChange={handleManteChange}
                    required
                  >
                    {mantenimientosPendientes.map((m) => (
                      <option key={m.id_control_mante} value={m.id_control_mante}>
                        Año {m.anio_periodo} - Q{m.monto_mantenimiento} ({m.estado_cobro})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Monto Acreditar (Q):</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control fw-bold text-success fs-5"
                  value={montoIngresado}
                  onChange={(e) => setMontoIngresado(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Método de Pago:</label>
                <select
                  className="form-select"
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DEPOSITO_BANCO">Depósito Bancario</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta de Crédito / Débito</option>
                </select>
              </div>

              {formData.metodo_pago !== 'EFECTIVO' && (
                <div className="mb-3">
                  <label className="form-label fw-bold">No. Boleta / Referencia Bancaria:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numero_boleta_banco}
                    onChange={(e) => setFormData({ ...formData, numero_boleta_banco: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Observaciones (Opcional):</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Procesando Cobro...' : 'Emitir Recibo de Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

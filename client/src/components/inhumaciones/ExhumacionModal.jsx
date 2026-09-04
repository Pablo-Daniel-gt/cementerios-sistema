import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { exhumarRegistro } from '../../api/inhumaciones.api';

export const ExhumacionModal = ({ registro, onClose, onSuccess }) => {
  const [nuevoEstado, setNuevoEstado] = useState('EXHUMADO');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  if (!registro) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const payload = {
        nuevo_estado: nuevoEstado,
        observaciones: observaciones,
      };

      const res = await exhumarRegistro(registro.id, payload);
      toast.success(res.data.message || 'Procedimiento procesado. El nicho ha sido liberado a Disponible.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al exhumar registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const nombreDifunto = registro.difunto_detalle
    ? `${registro.difunto_detalle.nombres} ${registro.difunto_detalle.apellidos}`
    : 'Persona Fallecida';

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-warning text-dark py-3">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-box-arrow-up-right me-2"></i>
              Orden de Exhumación / Traslado de Difunto
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="alert alert-warning border-0 shadow-sm mb-3">
                <strong className="d-block mb-1">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Liberación Automática de Espacio
                </strong>
                <span>
                  Al procesar la exhumación o traslado de <strong>{nombreDifunto}</strong>, el estado de la inhumación pasará a <strong>{nuevoEstado}</strong> y el nicho <strong>{registro.espacio_codigo}</strong> se liberará automáticamente a estado <strong>Disponible</strong> en el inventario.
                </span>
              </div>

              <div className="p-3 bg-light rounded border mb-3">
                <div className="row g-2 small">
                  <div className="col-6">
                    <strong>Nicho Actual:</strong> <span className="text-primary fw-bold">{registro.espacio_codigo}</span>
                  </div>
                  <div className="col-6">
                    <strong>Contrato:</strong> <span className="fw-bold">{registro.contrato_numero}</span>
                  </div>
                  <div className="col-12">
                    <strong>Fecha Sepelio:</strong> {new Date(registro.fecha_sepelio).toLocaleString('es-GT')}
                  </div>
                </div>
              </div>

              {/* Selección de Tipo de Procedimiento */}
              <div className="mb-3">
                <label className="form-label fw-bold">Tipo de Procedimiento *</label>
                <select
                  className="form-select form-select-lg"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  required
                >
                  <option value="EXHUMADO">Exhumación por Cumplimiento de Plazo / Restos</option>
                  <option value="TRASLADADO">Traslado a Otro Nicho / Osario / Cementerio</option>
                </select>
              </div>

              {/* Observaciones */}
              <div className="mb-3">
                <label className="form-label fw-bold">Observaciones / Motivo del Procedimiento *</label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Escriba los detalles de la orden sanitaria, resolución judicial o solicitud del titular..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-warning text-dark fw-bold" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-up-right me-1"></i> Confirmar y Liberar Nicho
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

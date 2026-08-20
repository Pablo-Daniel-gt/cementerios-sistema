import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { cambiarEstadoEspacio } from '../../api/inventario.api';
import { getEstadoColor } from '../../constants/estadoColors';

export function NichoModal({ espacio, estados = [], onClose, onUpdate }) {
  if (!espacio) return null;

  const [loading, setLoading] = useState(false);
  const [nuevoEstadoId, setNuevoEstadoId] = useState(espacio.estado_id || '');

  const isDisponible = espacio.estado === 'Disponible';
  const colorHex = getEstadoColor(espacio.estado);

  const handleGuardarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEstadoId) {
      toast.error('Seleccione un estado válido.');
      return;
    }

    setLoading(true);
    try {
      await cambiarEstadoEspacio(espacio.id_espacio, nuevoEstadoId);
      toast.success(`Estado de ${espacio.codigo_unico_espacio} actualizado correctamente.`);
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('No se pudo actualizar el estado del nicho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          {/* Cabecera del Modal */}
          <div className="modal-header text-white" style={{ backgroundColor: colorHex }}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-box-seam-fill"></i>
              Nicho: {espacio.codigo_unico_espacio}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <span className="text-muted d-block small">Estado Actual</span>
                <span 
                  className="badge px-3 py-2 fs-6 rounded-pill text-white"
                  style={{ backgroundColor: colorHex }}
                >
                  {espacio.estado}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted d-block small">Precio de Lista</span>
                <span className="fw-bold fs-5 text-success">
                  {espacio.precio_individual
                    ? `Q${Number(espacio.precio_individual).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                    : 'Consultar Precio'}
                </span>
              </div>
            </div>

            {/* Detalles Técnicos del Nicho */}
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="p-2 bg-light rounded border">
                  <small className="text-muted d-block">Ubicación Grilla</small>
                  <strong className="text-dark">Fila {espacio.posicion_fila} | Columna {espacio.posicion_columna}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 bg-light rounded border">
                  <small className="text-muted d-block">Dimensiones</small>
                  <strong className="text-dark">{espacio.dimensiones || '2.20m x 0.90m x 0.80m'}</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="p-2 bg-light rounded border">
                  <small className="text-muted d-block">Material de Construcción</small>
                  <strong className="text-dark">{espacio.material_construccion || 'Concreto Reforzado'}</strong>
                </div>
              </div>
            </div>

            {/* Alertas de Disponibilidad según RF-02 */}
            {!isDisponible && (
              <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
                <div>
                  <strong>Espacio no disponible para selección comercial.</strong> Este nicho se encuentra en estado <em>{espacio.estado}</em>.
                </div>
              </div>
            )}

            {/* Formulario de Cambio Rápido de Estado */}
            <form onSubmit={handleGuardarEstado} className="border-top pt-3">
              <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-gear-fill me-1"></i> Actualizar Estado del Espacio
              </h6>
              <div className="input-group">
                <select
                  className="form-select"
                  value={nuevoEstadoId}
                  onChange={(e) => setNuevoEstadoId(e.target.value)}
                >
                  <option value="" disabled hidden>Seleccionar Nuevo Estado</option>
                  {estados.map((est) => (
                    <option key={est.id_estado} value={est.id_estado}>
                      {est.nombre_estado}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-primary px-3"
                  disabled={loading || !nuevoEstadoId}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Pie del Modal */}
          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            {isDisponible && (
              <button 
                type="button" 
                className="btn btn-success d-flex align-items-center gap-1"
                onClick={() => {
                  toast.success(`Iniciando proceso comercial para el nicho ${espacio.codigo_unico_espacio}`);
                  onClose();
                }}
              >
                <i className="bi bi-cart-check-fill"></i>
                Cotizar / Apartar Nicho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

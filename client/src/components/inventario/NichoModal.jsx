import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cambiarEstadoEspacio, actualizarEspacio, eliminarEspacio } from '../../api/inventario.api';
import { getEstadoColor } from '../../constants/estadoColors';

/**
 * Modal de Detalle, Edición Individual, Cotización, Apartado y Eliminación de Nicho
 */
export function NichoModal({ espacio, estados = [], onClose, onUpdate }) {
  const navigate = useNavigate();

  if (!espacio) return null;

  const [loadingEstado, setLoadingEstado] = useState(false);
  const [loadingEdicion, setLoadingEdicion] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);

  const [nuevoEstadoId, setNuevoEstadoId] = useState(espacio.estado_id || '');
  const [precioIndividual, setPrecioIndividual] = useState(espacio.precio_individual || '');
  const [materialConstruccion, setMaterialConstruccion] = useState(espacio.material_construccion || 'Concreto Reforzado');
  const [dimensiones, setDimensiones] = useState(espacio.dimensiones || '2.20m x 0.90m x 0.80m');

  const [modoEdicion, setModoEdicion] = useState(false);

  const isDisponible = espacio.estado === 'Disponible';
  const colorHex = getEstadoColor(espacio.estado);

  useEffect(() => {
    if (espacio) {
      setNuevoEstadoId(espacio.estado_id || '');
      setPrecioIndividual(espacio.precio_individual || '');
      setMaterialConstruccion(espacio.material_construccion || 'Concreto Reforzado');
      setDimensiones(espacio.dimensiones || '2.20m x 0.90m x 0.80m');
    }
  }, [espacio]);

  // 1. Guardar Estado
  const handleGuardarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEstadoId) {
      toast.error('Seleccione un estado válido.');
      return;
    }

    setLoadingEstado(true);
    try {
      await cambiarEstadoEspacio(espacio.id_espacio, nuevoEstadoId);
      toast.success(`Estado de ${espacio.codigo_unico_espacio} actualizado correctamente.`);
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('No se pudo actualizar el estado del nicho.');
    } finally {
      setLoadingEstado(false);
    }
  };

  // 2. Guardar Datos Técnicos / Precio del Nicho (Módulo B - Punto 1)
  const handleGuardarDatosNicho = async (e) => {
    e.preventDefault();
    setLoadingEdicion(true);
    try {
      const datos = {
        precio_individual: precioIndividual ? parseFloat(precioIndividual) : null,
        material_construccion: materialConstruccion,
        dimensiones: dimensiones
      };
      await actualizarEspacio(espacio.id_espacio, datos);
      toast.success(`Datos del nicho ${espacio.codigo_unico_espacio} actualizados.`);
      setModoEdicion(false);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error al actualizar datos del nicho:', error);
    } finally {
      setLoadingEdicion(false);
    }
  };

  // 3. Eliminar Nicho (Módulo B - Punto 3)
  const handleEliminarNicho = async () => {
    const confirm = window.confirm(`¿Está seguro de eliminar permanentemente el nicho ${espacio.codigo_unico_espacio}? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    setLoadingEliminar(true);
    try {
      await eliminarEspacio(espacio.id_espacio);
      toast.success(`Nicho ${espacio.codigo_unico_espacio} eliminado correctamente.`);
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      console.error('Error al eliminar nicho:', error);
      toast.error('No se pudo eliminar el nicho. Verifique que no esté asignado a un contrato.');
    } finally {
      setLoadingEliminar(false);
    }
  };

  // 4. Cotizar Nicho (Módulo B - Punto 2)
  const handleCotizarNicho = () => {
    onClose();
    navigate('/comercial/cotizador', {
      state: {
        monto_total: espacio.precio_individual || '15000',
        monto_enganche: String(parseFloat(espacio.precio_individual || '15000') * 0.15)
      }
    });
  };

  // 5. Apartar / Crear Contrato Directamente (Módulo B - Punto 2)
  const handleApartarContrato = () => {
    onClose();
    navigate('/comercial/contratos/nuevo', {
      state: {
        espacioId: espacio.id_espacio,
        monto_total: espacio.precio_individual || '15000'
      }
    });
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow border-0">
          {/* Cabecera del Modal */}
          <div className="modal-header text-white" style={{ backgroundColor: colorHex }}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-box-seam-fill"></i>
              Nicho: {espacio.codigo_unico_espacio}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <span className="text-muted d-block small">Estado Actual</span>
                <span className="badge px-3 py-2 fs-6 rounded-pill text-white" style={{ backgroundColor: colorHex }}>
                  {espacio.estado}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted d-block small">Precio de Lista (Q)</span>
                <strong className="fs-4 text-success">
                  {espacio.precio_individual
                    ? `Q${Number(espacio.precio_individual).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                    : 'Sin Precio Establecido'}
                </strong>
              </div>
            </div>

            {/* Alternar entre Modo Lectura y Modo Edición */}
            {!modoEdicion ? (
              <>
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
                    <div className="p-2 bg-light rounded border d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted d-block">Material de Construcción</small>
                        <strong className="text-dark">{espacio.material_construccion || 'Concreto Reforzado'}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setModoEdicion(true)}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Editar Precio / Datos
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleGuardarDatosNicho} className="bg-light p-3 rounded border mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-pencil-fill me-1"></i> Editar Información Individual del Nicho
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Precio Individual (Q):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={precioIndividual}
                      onChange={(e) => setPrecioIndividual(e.target.value)}
                      placeholder="Ej. 15000.00"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Material de Construcción:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={materialConstruccion}
                      onChange={(e) => setMaterialConstruccion(e.target.value)}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Dimensiones:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={dimensiones}
                      onChange={(e) => setDimensiones(e.target.value)}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setModoEdicion(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={loadingEdicion}>
                      {loadingEdicion ? 'Guardando...' : 'Guardar Cambios del Nicho'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {!isDisponible && (
              <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
                <div>
                  <strong>Espacio no disponible para venta directa.</strong> Este nicho se encuentra en estado <em>{espacio.estado}</em>.
                </div>
              </div>
            )}

            {/* Formulario de Cambio Rápido de Estado */}
            <form onSubmit={handleGuardarEstado} className="border-top pt-3">
              <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-gear-fill me-1"></i> Cambiar Estado Operacional
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
                <button type="submit" className="btn btn-primary px-3" disabled={loadingEstado || !nuevoEstadoId}>
                  {loadingEstado ? 'Guardando...' : 'Actualizar Estado'}
                </button>
              </div>
            </form>
          </div>

          {/* Pie del Modal */}
          <div className="modal-footer bg-light d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleEliminarNicho}
              disabled={loadingEliminar}
            >
              <i className="bi bi-trash-fill me-1"></i> Eliminar Nicho
            </button>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>

              {isDisponible && (
                <>
                  <button
                    type="button"
                    className="btn btn-info text-white"
                    onClick={handleCotizarNicho}
                  >
                    <i className="bi bi-calculator-fill me-1"></i> Cotizar
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleApartarContrato}
                  >
                    <i className="bi bi-cart-check-fill me-1"></i> Apartar / Crear Contrato
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

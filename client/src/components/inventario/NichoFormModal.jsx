import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { crearEspacio, actualizarEspacio } from '../../api/inventario.api';

export function NichoFormModal({ nicho = null, estructuras = [], estados = [], defaultEstructuraId = '', onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    estructura: defaultEstructuraId || (estructuras.length > 0 ? estructuras[0].id_estructura : ''),
    estado: estados.length > 0 ? estados[0].id_estado : '',
    posicion_fila: 1,
    posicion_columna: 1,
    codigo_unico_espacio: '',
    precio_individual: '',
    dimensiones: '2.20m x 0.90m x 0.80m',
    material_construccion: 'Concreto Reforzado',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nicho) {
      setFormData({
        estructura: nicho.estructura || defaultEstructuraId,
        estado: nicho.estado_id || (nicho.estado ? (estados.find(e => e.nombre_estado === nicho.estado)?.id_estado || '') : ''),
        posicion_fila: nicho.posicion_fila || 1,
        posicion_columna: nicho.posicion_columna || 1,
        codigo_unico_espacio: nicho.codigo_unico_espacio || '',
        precio_individual: nicho.precio_individual || '',
        dimensiones: nicho.dimensiones || '2.20m x 0.90m x 0.80m',
        material_construccion: nicho.material_construccion || 'Concreto Reforzado',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        estructura: defaultEstructuraId || (estructuras.length > 0 ? estructuras[0].id_estructura : prev.estructura),
        estado: estados.length > 0 ? estados[0].id_estado : prev.estado,
      }));
    }
  }, [nicho, defaultEstructuraId, estructuras, estados]);

  const estSeleccionadaModal = estructuras.find((e) => Number(e.id_estructura) === Number(formData.estructura));
  const esEstructuraLlenaModal = !nicho && estSeleccionadaModal && estSeleccionadaModal.capacidad_total_espacios > 0 && ((estSeleccionadaModal.total_espacios_creados || 0) >= estSeleccionadaModal.capacidad_total_espacios);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.estructura) {
      toast.error('Debe seleccionar una Estructura Física.');
      return;
    }
    if (!formData.estado) {
      toast.error('Debe seleccionar un Estado para el Nicho.');
      return;
    }
    if (esEstructuraLlenaModal) {
      toast.error('La estructura física ya ha alcanzado el 100% de su capacidad de nichos.');
      return;
    }

    const payload = {
      ...formData,
      posicion_fila: parseInt(formData.posicion_fila, 10),
      posicion_columna: parseInt(formData.posicion_columna, 10),
      precio_individual: formData.precio_individual ? parseFloat(formData.precio_individual) : null,
    };

    setLoading(true);
    try {
      if (nicho && nicho.id_espacio) {
        await actualizarEspacio(nicho.id_espacio, payload);
        toast.success('Nicho actualizado correctamente.');
      } else {
        await crearEspacio(payload);
        toast.success('Nicho registrado exitosamente.');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar nicho:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-box-seam-fill"></i>
              {nicho ? 'Editar Nicho / Espacio Físico' : 'Nuevo Nicho Individual'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {esEstructuraLlenaModal && (
                <div className="alert alert-warning py-2 mb-3 small fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Esta estructura física ya ha alcanzado el 100% de su capacidad ({estSeleccionadaModal.total_espacios_creados} / {estSeleccionadaModal.capacidad_total_espacios} nichos). No es posible registrar más nichos en ella.
                </div>
              )}
              <div className="row g-3">
                {/* Estructura */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Estructura Física *</label>
                  <select
                    className="form-select"
                    value={formData.estructura}
                    onChange={(e) => setFormData({ ...formData, estructura: e.target.value })}
                    required
                  >
                    <option value="" disabled>-- Seleccionar Estructura Física --</option>
                    {estructuras.map((est) => (
                      <option key={est.id_estructura} value={est.id_estructura}>
                        {est.nombre_estructura} ({est.codigo_estructura})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Estado Inicial *</label>
                  <select
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                  >
                    <option value="" disabled>-- Seleccionar Estado --</option>
                    {estados.map((est) => (
                      <option key={est.id_estado} value={est.id_estado}>
                        {est.nombre_estado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Posición Fila */}
                <div className="col-12 col-md-3">
                  <label className="form-label fw-bold">Fila</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.posicion_fila}
                    onChange={(e) => setFormData({ ...formData, posicion_fila: e.target.value })}
                    required
                  />
                </div>

                {/* Posición Columna */}
                <div className="col-12 col-md-3">
                  <label className="form-label fw-bold">Columna</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.posicion_columna}
                    onChange={(e) => setFormData({ ...formData, posicion_columna: e.target.value })}
                    required
                  />
                </div>

                {/* Código Único (Opcional - Autogenerado si vacío) */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Código Único (Opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Auto-generado si se deja vacío"
                    value={formData.codigo_unico_espacio}
                    onChange={(e) => setFormData({ ...formData, codigo_unico_espacio: e.target.value })}
                  />
                  <small className="text-muted">Ejemplo: SEC-A-PAB-01-F1-C1</small>
                </div>

                {/* Precio Individual */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Precio Individual (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ej. 15000.00"
                    value={formData.precio_individual}
                    onChange={(e) => setFormData({ ...formData, precio_individual: e.target.value })}
                  />
                </div>

                {/* Dimensiones */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Dimensiones</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.dimensiones}
                    onChange={(e) => setFormData({ ...formData, dimensiones: e.target.value })}
                  />
                </div>

                {/* Material */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Material de Construcción</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.material_construccion}
                    onChange={(e) => setFormData({ ...formData, material_construccion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading || esEstructuraLlenaModal}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Guardar Nicho'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

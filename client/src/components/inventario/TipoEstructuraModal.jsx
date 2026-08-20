import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { crearTipoEstructura, actualizarTipoEstructura } from '../../api/inventario.api';

export function TipoEstructuraModal({ tipo = null, onClose, onSuccess }) {
  const [tipoForm, setTipoForm] = useState({
    nombre_tipo: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tipo) {
      setTipoForm({
        nombre_tipo: tipo.nombre_tipo || '',
        descripcion: tipo.descripcion || '',
      });
    } else {
      setTipoForm({ nombre_tipo: '', descripcion: '' });
    }
  }, [tipo]);

  const handleSaveTipo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tipo) {
        await actualizarTipoEstructura(tipo.id_tipo_estructura, tipoForm);
        toast.success('Tipo de estructura actualizado correctamente.');
      } else {
        await crearTipoEstructura(tipoForm);
        toast.success('Tipo de estructura registrado exitosamente.');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar tipo de estructura:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title fw-bold">
              {tipo ? 'Editar Tipo de Estructura' : 'Nuevo Tipo de Estructura'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSaveTipo}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label fw-bold">Nombre de Tipo de Estructura *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Pabellón, Mausoleo, Capilla"
                  value={tipoForm.nombre_tipo}
                  onChange={(e) => setTipoForm({ ...tipoForm, nombre_tipo: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Detalles o especificaciones del tipo de construcción"
                  value={tipoForm.descripcion}
                  onChange={(e) => setTipoForm({ ...tipoForm, descripcion: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-info text-white" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Guardar Tipo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { crearEstructura, actualizarEstructura } from '../../api/inventario.api';

export function EstructuraModal({ estructura = null, sectores = [], tipos = [], onClose, onSuccess }) {
  const [estructuraForm, setEstructuraForm] = useState({
    sector: sectores.length > 0 ? sectores[0].id_sector : '',
    tipo_estructura: tipos.length > 0 ? tipos[0].id_tipo_estructura : '',
    nombre_estructura: '',
    codigo_estructura: '',
    total_filas: 4,
    total_columnas: 5,
    precio_estructura_completa: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (estructura) {
      setEstructuraForm({
        sector: estructura.sector || '',
        tipo_estructura: estructura.tipo_estructura || '',
        nombre_estructura: estructura.nombre_estructura || '',
        codigo_estructura: estructura.codigo_estructura || '',
        total_filas: estructura.total_filas || 4,
        total_columnas: estructura.total_columnas || 5,
        precio_estructura_completa: estructura.precio_estructura_completa || '',
      });
    } else {
      setEstructuraForm({
        sector: sectores.length > 0 ? sectores[0].id_sector : '',
        tipo_estructura: tipos.length > 0 ? tipos[0].id_tipo_estructura : '',
        nombre_estructura: '',
        codigo_estructura: '',
        total_filas: 4,
        total_columnas: 5,
        precio_estructura_completa: '',
      });
    }
  }, [estructura, sectores, tipos]);

  const handleSaveEstructura = async (e) => {
    e.preventDefault();
    if (!estructuraForm.sector) {
      toast.error('Debe seleccionar un Sector válido.');
      return;
    }
    if (!estructuraForm.tipo_estructura) {
      toast.error('Debe seleccionar un Tipo de Estructura válido.');
      return;
    }

    if (estructuraForm.precio_estructura_completa !== '' && estructuraForm.precio_estructura_completa !== null) {
      const precioNum = parseFloat(estructuraForm.precio_estructura_completa);
      if (isNaN(precioNum) || precioNum < 0) {
        toast.error('El precio de la estructura no puede ser un valor negativo.');
        return;
      }
    }

    const datos = {
      ...estructuraForm,
      precio_estructura_completa: estructuraForm.precio_estructura_completa ? parseFloat(estructuraForm.precio_estructura_completa) : null,
    };

    setLoading(true);
    try {
      if (estructura) {
        await actualizarEstructura(estructura.id_estructura, datos);
        toast.success('Estructura física actualizada correctamente.');
      } else {
        await crearEstructura(datos);
        toast.success('Estructura física registrada exitosamente.');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar estructura:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">
              {estructura ? 'Editar Estructura Física' : 'Nueva Estructura Física'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSaveEstructura}>
            <div className="modal-body p-4">
              <div className="row g-3">
                {/* Selector de Sector */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Sector *</label>
                  <select
                    className="form-select"
                    value={estructuraForm.sector}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, sector: e.target.value })}
                    required
                  >
                    <option value="" disabled>-- Seleccionar Sector --</option>
                    {sectores.map((sec) => (
                      <option key={sec.id_sector} value={sec.id_sector}>
                        {sec.nombre_sector} ({sec.nomenclatura})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Tipo de Estructura */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Tipo de Estructura *</label>
                  <select
                    className="form-select"
                    value={estructuraForm.tipo_estructura}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, tipo_estructura: e.target.value })}
                    required
                  >
                    <option value="" disabled>-- Seleccionar Tipo de Estructura --</option>
                    {tipos.map((t) => (
                      <option key={t.id_tipo_estructura} value={t.id_tipo_estructura}>
                        {t.nombre_tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Nombre de la Estructura *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Pabellón San José"
                    value={estructuraForm.nombre_estructura}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, nombre_estructura: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold">Código Único de Estructura *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. PAB-01"
                    value={estructuraForm.codigo_estructura}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, codigo_estructura: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Total Filas *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={estructuraForm.total_filas}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, total_filas: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Total Columnas *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={estructuraForm.total_columnas}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, total_columnas: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Capacidad Total Estimada</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={`${estructuraForm.total_filas * estructuraForm.total_columnas} nichos`}
                    disabled
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Precio Estructura Completa (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="Ej. 300000.00"
                    value={estructuraForm.precio_estructura_completa}
                    onChange={(e) => setEstructuraForm({ ...estructuraForm, precio_estructura_completa: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Guardar Estructura'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

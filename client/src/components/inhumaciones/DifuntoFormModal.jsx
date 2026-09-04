import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { crearDifunto, actualizarDifunto } from '../../api/inhumaciones.api';

export const DifuntoFormModal = ({ difunto, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    cui: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    fecha_defuncion: '',
    causa_muerte: '',
    lugar_defuncion: '',
  });

  const [loading, setLoading] = useState(false);
  const esEdicion = !!difunto;

  useEffect(() => {
    if (difunto) {
      setFormData({
        cui: difunto.cui || '',
        nombres: difunto.nombres || '',
        apellidos: difunto.apellidos || '',
        fecha_nacimiento: difunto.fecha_nacimiento || '',
        fecha_defuncion: difunto.fecha_defuncion || '',
        causa_muerte: difunto.causa_muerte || '',
        lugar_defuncion: difunto.lugar_defuncion || '',
      });
    }
  }, [difunto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (formData.cui) {
      const cuiTrim = formData.cui.trim();
      if (cuiTrim.length !== 13 || !/^\d+$/.test(cuiTrim)) {
        toast.error('El CUI debe contener exactamente 13 dígitos numéricos.');
        return;
      }
    }

    if (formData.fecha_nacimiento && formData.fecha_defuncion) {
      if (new Date(formData.fecha_nacimiento) > new Date(formData.fecha_defuncion)) {
        toast.error('La fecha de nacimiento no puede ser posterior a la fecha de defunción.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        cui: formData.cui ? formData.cui.trim() : null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        lugar_defuncion: formData.lugar_defuncion || null,
      };

      if (esEdicion) {
        await actualizarDifunto(difunto.id, payload);
        toast.success(`Datos de ${formData.nombres} ${formData.apellidos} actualizados correctamente.`);
      } else {
        await crearDifunto(payload);
        toast.success(`Difunto ${formData.nombres} ${formData.apellidos} registrado exitosamente.`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar difunto:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-dark text-white py-3">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              {esEdicion ? 'Editar Registro de Difunto' : 'Registro Biográfico de Persona Fallecida'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="alert alert-info border-0 shadow-sm mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill fs-5 text-info"></i>
                <small>
                  El CUI es opcional para recién nacidos sin documento emitido por RENAP. Para mayores de edad, se recomienda ingresar los 13 dígitos.
                </small>
              </div>

              <div className="row g-3">
                {/* CUI / DPI */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">CUI / DPI (RENAP)</label>
                  <input
                    type="text"
                    name="cui"
                    className="form-control"
                    placeholder="Ej. 1234567890101 (13 dígitos)"
                    maxLength={13}
                    value={formData.cui}
                    onChange={handleChange}
                  />
                  <small className="text-muted">Dejar en blanco para neonatos sin CUI</small>
                </div>

                {/* Nombres */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nombres *</label>
                  <input
                    type="text"
                    name="nombres"
                    className="form-control"
                    placeholder="Ej. María Mercedes"
                    value={formData.nombres}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Apellidos */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    className="form-control"
                    placeholder="Ej. López Castillo"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Causa de Muerte */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Causa de Muerte *</label>
                  <input
                    type="text"
                    name="causa_muerte"
                    className="form-control"
                    placeholder="Ej. Paro cardiorrespiratorio"
                    value={formData.causa_muerte}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Fecha Nacimiento */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    className="form-control"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                  />
                </div>

                {/* Fecha Defuncion */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Fecha de Defunción *</label>
                  <input
                    type="date"
                    name="fecha_defuncion"
                    className="form-control"
                    value={formData.fecha_defuncion}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Lugar Defuncion */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Lugar de Defunción</label>
                  <input
                    type="text"
                    name="lugar_defuncion"
                    className="form-control"
                    placeholder="Ej. Hospital Nacional de Huehuetenango / Domicilio Particular"
                    value={formData.lugar_defuncion}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Guardando...
                  </>
                ) : esEdicion ? (
                  'Guardar Cambios'
                ) : (
                  'Registrar Difunto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

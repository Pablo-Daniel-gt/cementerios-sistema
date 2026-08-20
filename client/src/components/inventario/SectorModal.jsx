import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { crearSector, actualizarSector } from '../../api/inventario.api';

export function SectorModal({ sector = null, onClose, onSuccess }) {
  const [sectorForm, setSectorForm] = useState({
    nombre_sector: '',
    nomenclatura: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sector) {
      setSectorForm({
        nombre_sector: sector.nombre_sector || '',
        nomenclatura: sector.nomenclatura || '',
        descripcion: sector.descripcion || '',
      });
    } else {
      setSectorForm({ nombre_sector: '', nomenclatura: '', descripcion: '' });
    }
  }, [sector]);

  const handleSaveSector = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (sector) {
        await actualizarSector(sector.id_sector, sectorForm);
        toast.success('Sector actualizado correctamente.');
      } else {
        await crearSector(sectorForm);
        toast.success('Sector registrado exitosamente.');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar sector:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title fw-bold">
              {sector ? 'Editar Sector' : 'Nuevo Sector de Camposanto'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSaveSector}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label fw-bold">Nombre del Sector *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Sector A - Jardines"
                  value={sectorForm.nombre_sector}
                  onChange={(e) => setSectorForm({ ...sectorForm, nombre_sector: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Nomenclatura (Código Corto) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. SEC-A"
                  value={sectorForm.nomenclatura}
                  onChange={(e) => setSectorForm({ ...sectorForm, nomenclatura: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Detalles sobre el área o ubicación"
                  value={sectorForm.descripcion}
                  onChange={(e) => setSectorForm({ ...sectorForm, descripcion: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Guardar Sector'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { simularCotizacion, descargarCotizacionPDF } from '../../api/comercial.api';
import { AmortizacionTabla } from './AmortizacionTabla';

/**
 * Modal de Cotizador Financiero Rápido (RF-01)
 */
export const CotizadorModal = ({ show, onClose, onUsarCotizacion }) => {
  const [formData, setFormData] = useState({
    monto_total: '24000',
    monto_enganche: '4000',
    plazo_meses: '24',
    cliente_nombre: 'Cliente Prospecto'
  });
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultado, setResultado] = useState(null);

  if (!show) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSimular = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        monto_total: parseFloat(formData.monto_total),
        monto_enganche: parseFloat(formData.monto_enganche),
        plazo_meses: parseInt(formData.plazo_meses, 10),
        cliente_nombre: formData.cliente_nombre
      };

      const { data } = await simularCotizacion(payload);
      setResultado(data);
      toast.success('Cotización calculada exitosamente');
    } catch (error) {
      console.error('Error al cotizar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    setDownloadingPdf(true);
    try {
      const payload = {
        monto_total: parseFloat(formData.monto_total),
        monto_enganche: parseFloat(formData.monto_enganche),
        plazo_meses: parseInt(formData.plazo_meses, 10),
        cliente_nombre: formData.cliente_nombre
      };

      const response = await descargarCotizacionPDF(payload);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cotizacion_${formData.cliente_nombre.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF de Cotización generado en menos de 3 segundos');
    } catch (error) {
      toast.error('Error al generar PDF de la cotización');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-calculator-fill me-2"></i>
              Simulador Financiero de Cotizaciones
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSimular} className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Cliente / Prospecto:</label>
                <input
                  type="text"
                  name="cliente_nombre"
                  className="form-control"
                  value={formData.cliente_nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Precio Total del Inmueble (Q):</label>
                <input
                  type="number"
                  step="0.01"
                  name="monto_total"
                  className="form-control"
                  value={formData.monto_total}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Monto de Enganche (Q):</label>
                <input
                  type="number"
                  step="0.01"
                  name="monto_enganche"
                  className="form-control"
                  value={formData.monto_enganche}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Plazo a Financiar:</label>
                <select
                  name="plazo_meses"
                  className="form-select"
                  value={formData.plazo_meses}
                  onChange={handleChange}
                >
                  <option value="12">12 Meses (1 Año)</option>
                  <option value="24">24 Meses (2 Años)</option>
                  <option value="36">36 Meses (3 Años)</option>
                  <option value="48">48 Meses (4 Años)</option>
                  <option value="60">60 Meses (5 Años)</option>
                </select>
              </div>

              <div className="col-12 d-flex gap-2 justify-content-end mt-3">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Calculando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cpu me-1"></i> Simular Cuotas
                    </>
                  )}
                </button>
              </div>
            </form>

            {resultado && (
              <div className="border-top pt-3">
                <div className="row text-center mb-3">
                  <div className="col-md-4">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block">Saldo a Financiar</small>
                      <strong className="text-dark fs-5">
                        Q{resultado.monto_financiar?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block">Plazo Elegido</small>
                      <strong className="text-primary fs-5">{resultado.plazo_meses} Meses</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2 border rounded bg-success bg-opacity-10">
                      <small className="text-muted d-block">Cuota Mensual Estimada</small>
                      <strong className="text-success fs-4">
                        Q{resultado.monto_cuota_estimada?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Tabla Proyectada de Amortización:</h6>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleDescargarPDF}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? (
                      'Generando PDF...'
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> Descargar PDF (Q)
                      </>
                    )}
                  </button>
                </div>

                <AmortizacionTabla cuotas={resultado.cuotas} />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            {resultado && onUsarCotizacion && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  onUsarCotizacion(resultado, formData);
                  onClose();
                }}
              >
                <i className="bi bi-file-earmark-plus-fill me-1"></i> Iniciar Contrato con esta Cotización
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

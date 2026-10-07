import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { simularCotizacion, descargarCotizacionPDF } from '../../api/comercial.api';
import { AmortizacionTabla } from '../../components/comercial/AmortizacionTabla';

/**
 * Vista Principal del Cotizador Financiero Automático (RF-01)
 */
export const CotizadorPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    monto_total: '30000',
    monto_enganche: '5000',
    plazo_meses: '24',
    cliente_nombre: 'Prospecto de Venta'
  });

  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSimular = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.monto_enganche) > parseFloat(formData.monto_total)) {
      toast.error('El enganche no puede ser superior al precio total');
      return;
    }

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
      toast.success('Simulación financiera calculada en Quetzales');
    } catch (error) {
      console.error('Error al simular:', error);
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
      toast.success('Cotización formal en PDF descargada en menos de 3 segundos');
    } catch (error) {
      toast.error('Error al exportar cotización a PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCrearContrato = () => {
    navigate('/comercial/contratos/nuevo', {
      state: {
        monto_total: formData.monto_total,
        monto_enganche: formData.monto_enganche,
        plazo_meses: formData.plazo_meses
      }
    });
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-calculator-fill text-primary me-2"></i>
            Cotizador Financiero Automático
          </h2>
          <small className="text-muted">
            Simulador de planes Quetzales (Q00.00)
          </small>
        </div>
      </div>

      <div className="row g-4">
        {/* Formulario de Parámetros */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white py-3">
              <h6 className="card-title mb-0 fw-bold">
                <i className="bi bi-sliders me-2"></i> Parámetros de la Venta
              </h6>
            </div>
            <div className="card-body">
              <form onSubmit={handleSimular}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del Cliente Prospecto:</label>
                  <input
                    type="text"
                    name="cliente_nombre"
                    className="form-control"
                    value={formData.cliente_nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Precio Total del Inmueble (Q):</label>
                  <div className="input-group">
                    <span className="input-group-text">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      name="monto_total"
                      className="form-control fw-bold"
                      value={formData.monto_total}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Monto de Enganche (Q):</label>
                  <div className="input-group">
                    <span className="input-group-text">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      name="monto_enganche"
                      className="form-control fw-bold"
                      value={formData.monto_enganche}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Plazo de Financiamiento:</label>
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

                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                  {loading ? 'Calculando Cuotas...' : 'Simular Plan de Amortización'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Resultado y Amortización */}
        <div className="col-lg-8">
          {resultado ? (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                <h6 className="card-title mb-0 fw-bold">
                  <i className="bi bi-table me-2"></i> Proyección de cuotas
                </h6>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDescargarPDF}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? 'Exportando...' : <><i className="bi bi-file-earmark-pdf-fill me-1"></i> Exportar PDF (Q)</>}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleCrearContrato}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i> Formalizar Contrato
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="row text-center mb-4">
                  <div className="col-md-4">
                    <div className="p-3 border rounded bg-light">
                      <small className="text-muted d-block">Saldo Neto a Financiar</small>
                      <strong className="text-dark fs-5">
                        Q{resultado.monto_financiar?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded bg-light">
                      <small className="text-muted d-block">Plazo Elegido</small>
                      <strong className="text-primary fs-5">{resultado.plazo_meses} Meses</strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded bg-success bg-opacity-10 border-success">
                      <small className="text-muted d-block">Cuota Mensual Estimada</small>
                      <strong className="text-success fs-4">
                        Q{resultado.monto_cuota_estimada?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <AmortizacionTabla cuotas={resultado.cuotas} />
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0 text-center py-5">
              <div className="card-body text-muted">
                <i className="bi bi-calculator display-1 text-primary opacity-50 mb-3 d-block"></i>
                <h5 className="fw-bold">Ingrese los parámetros comerciales para generar la proyección</h5>
                <p className="small mb-0">Podrá exportar la cotización oficial en formato PDF en menos de 3 segundos.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

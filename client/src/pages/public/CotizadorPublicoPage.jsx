import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { simularCotizacionPublica, descargarCotizacionPublicaPDF, getCatalogoEspaciosPublico } from '../../api/publico.api';
import toast from 'react-hot-toast';

export const CotizadorPublicoPage = () => {
  const location = useLocation();
  const initialMonto = location.state?.monto || 15000;
  const initialTipo = location.state?.tipo || '';

  const [clienteNombre, setClienteNombre] = useState('');
  const [montoTotal, setMontoTotal] = useState(initialMonto);
  const [porcentajeEnganche, setPorcentajeEnganche] = useState(20);
  const [plazoMeses, setPlazoMeses] = useState(36);
  const [catalogo, setCatalogo] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    cargarCatalogo();
  }, []);

  useEffect(() => {
    calcularCotizacion();
  }, [montoTotal, porcentajeEnganche, plazoMeses]);

  const cargarCatalogo = async () => {
    try {
      const res = await getCatalogoEspaciosPublico();
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      setCatalogo(data);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
      setCatalogo([]);
    }
  };

  const calcularCotizacion = async () => {
    if (!montoTotal || montoTotal <= 0) return;

    const montoEnganche = Number(((montoTotal * porcentajeEnganche) / 100).toFixed(2));
    const payload = {
      monto_total: Number(montoTotal),
      monto_enganche: montoEnganche,
      plazo_meses: Number(plazoMeses),
      cliente_nombre: clienteNombre.trim() || 'Familia / Solicitante'
    };

    try {
      setLoading(true);
      const res = await simularCotizacionPublica(payload);
      setResultado(res.data);
    } catch (err) {
      console.error('Error al simular cotización:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    const montoEnganche = Number(((montoTotal * porcentajeEnganche) / 100).toFixed(2));
    const payload = {
      monto_total: Number(montoTotal),
      monto_enganche: montoEnganche,
      plazo_meses: Number(plazoMeses),
      cliente_nombre: clienteNombre.trim() || 'Estimado(a) Cliente / Familia'
    };

    try {
      setDownloadingPdf(true);
      const res = await descargarCotizacionPublicaPDF(payload);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cotizacion_Memorial_Los_Robles_${plazoMeses}meses.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Cotización en PDF generada exitosamente.');
    } catch (err) {
      toast.error('Error al generar el documento PDF.');
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSeleccionarEspacio = (precio, tipo) => {
    setMontoTotal(precio);
    toast.success(`Seleccionado: ${tipo}`);
  };

  const montoEngancheCalculado = Number(((montoTotal * porcentajeEnganche) / 100).toFixed(2));
  const montoFinanciarCalculado = Math.max(0, Number((montoTotal - montoEngancheCalculado).toFixed(2)));

  return (
    <div>
      {/* Header */}
      <section className="bg-navy-dark text-white py-5 text-center">
        <div className="container py-3">
          <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold mb-2">
            Simulador Accesible y Transparente
          </span>
          <h1 className="fw-bold display-6 mb-2">Cotizador de Planes de Financiamiento</h1>
          <p className="lead text-white-50 fs-6 mx-auto mb-0" style={{ maxWidth: '680px' }}>
            Planifique la tranquilidad y resguardo familiar con cuotas accesibles en Quetzales (Q), plazos de 24 a 60 meses y sin cobros ocultos.
          </p>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Columna Izquierda: Parámetros del Cotizador */}
            <div className="col-lg-5">
              <div className="card card-empathic p-4 border-0 shadow-sm bg-white mb-4">
                <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-success"></i>
                  Parámetros de la Cotización
                </h5>

                {/* Selección Rápida por Espacio */}
                {Array.isArray(catalogo) && catalogo.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label text-secondary fw-semibold small">
                      Seleccionar Espacio del Catálogo:
                    </label>
                    <div className="d-flex flex-column gap-1.5">
                      {catalogo.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSeleccionarEspacio(cat.precio_base, cat.tipo)}
                          className={`btn btn-sm text-start d-flex justify-content-between align-items-center p-2.5 rounded-3 border ${
                            Number(montoTotal) === Number(cat.precio_base)
                              ? 'border-success bg-success-subtle text-dark fw-bold'
                              : 'border-light-subtle bg-light text-secondary'
                          }`}
                        >
                          <span className="small">{cat.tipo}</span>
                          <span className="badge bg-white text-success border">
                            Q{Number(cat.precio_base).toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nombre de Contacto / Prospecto */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold small">
                    Nombre o Familia Solicitante (Opcional):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Familia Morales López"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                  />
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Aparecerá en el encabezado de su cotización en PDF.
                  </small>
                </div>

                {/* Monto Total */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold small">
                    Monto Total del Inmueble / Espacio (Q):
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-bold">Q</span>
                    <input
                      type="number"
                      className="form-control fw-bold"
                      min="1000"
                      step="500"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Enganche */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-secondary fw-semibold small mb-0">
                      Enganche Inicial ({porcentajeEnganche}%):
                    </label>
                    <span className="fw-bold text-success small">
                      Q{montoEngancheCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="10"
                    max="50"
                    step="5"
                    value={porcentajeEnganche}
                    onChange={(e) => setPorcentajeEnganche(Number(e.target.value))}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>10%</span>
                    <span>20%</span>
                    <span>30%</span>
                    <span>40%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Plazo en Meses */}
                <div className="mb-4">
                  <label className="form-label text-secondary fw-semibold small mb-2">
                    Plazo de Financiamiento:
                  </label>
                  <div className="row g-2">
                    {[24, 36, 48, 60].map((meses) => (
                      <div key={meses} className="col-3">
                        <button
                          type="button"
                          onClick={() => setPlazoMeses(meses)}
                          className={`btn w-100 py-2 btn-sm fw-bold ${
                            plazoMeses === meses ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                          }`}
                        >
                          {meses} m
                        </button>
                      </div>
                    ))}
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Plazos disponibles de 2 a 5 años sin recargo por pago anticipado.
                  </small>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Resumen de la Simulación y Tabla */}
            <div className="col-lg-7">
              {/* Tarjeta de Resumen */}
              <div className="card card-empathic p-4 border-0 shadow bg-navy-dark text-white mb-4">
                <div className="row align-items-center g-3">
                  <div className="col-sm-6 text-center text-sm-start">
                    <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
                      Cuota Mensual Estimada
                    </span>
                    <div className="display-5 fw-bold text-white lh-1 mb-1">
                      Q{resultado?.monto_cuota_estimada?.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <small className="text-white-50">Por mes durante {plazoMeses} meses</small>
                  </div>

                  <div className="col-sm-6 border-start border-white border-opacity-10 ps-sm-4">
                    <div className="d-flex flex-column gap-1.5 small text-white-70">
                      <div className="d-flex justify-content-between">
                        <span>Monto Total:</span>
                        <strong className="text-white">Q{Number(montoTotal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Enganche ({porcentajeEnganche}%):</span>
                        <strong className="text-success">Q{montoEngancheCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Saldo a Financiar:</span>
                        <strong className="text-white">Q{montoFinanciarCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>

                    <button
                      onClick={handleDescargarPDF}
                      disabled={downloadingPdf || loading}
                      className="btn btn-warning w-100 mt-3 fw-bold btn-sm d-flex align-items-center justify-content-center gap-2 shadow-sm text-dark"
                    >
                      {downloadingPdf ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Generando PDF...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                          <span>Descargar Cotización (PDF)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de Proyección de Cuotas */}
              <div className="card card-empathic p-4 border-0 shadow-sm bg-white">
                <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-table text-primary me-2"></i>
                    Proyección de Amortización Mensual ({resultado?.cuotas?.length || 0} Cuotas)
                  </span>
                  <span className="badge bg-light text-muted border">Moneda: GTQ (Q)</span>
                </h6>

                <div className="table-responsive" style={{ maxHeight: '380px' }}>
                  <table className="table table-hover table-sm align-middle small mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th className="text-center"># Cuota</th>
                        <th>Fecha Vencimiento</th>
                        <th className="text-end">Monto Cuota</th>
                        <th className="text-end">Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado?.cuotas?.map((c) => (
                        <tr key={c.numero_cuota}>
                          <td className="text-center fw-semibold text-secondary">{c.numero_cuota}</td>
                          <td>{c.fecha_vencimiento}</td>
                          <td className="text-end fw-bold text-success">
                            Q{Number(c.monto_cuota).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-end text-muted">
                            Q{Number(c.saldo_restante).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                  <span>* Valores orientativos sujetos a formalización en contrato de derecho de uso.</span>
                  <Link to="/contacto" className="text-success fw-semibold text-decoration-none">
                    Contactar a un Asesor <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

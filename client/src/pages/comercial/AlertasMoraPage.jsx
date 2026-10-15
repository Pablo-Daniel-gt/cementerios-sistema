import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAlertasMora, descargarReporteMorososPDF } from '../../api/comercial.api';
import { AlertaMoraCard } from '../../components/comercial/AlertaMoraCard';
import { ReciboFormModal } from '../../components/comercial/ReciboFormModal';

/**
 * Tablero de Alertas de Cobranza y Mora (RF-06)
 * Clasifica clientes por niveles de riesgo:
 * - Preventivo (1 a 30 días)
 * - Operativo (31 a 90 días)
 * - Extrajudicial (> 90 días)
 */
export const AlertasMoraPage = () => {
  const [dataAlertas, setDataAlertas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('morosos'); // Por defecto ver a los morosos (>31 días)

  // Modal Recibo
  const [contratoCobro, setContratoCobro] = useState(null);
  const [showReciboModal, setShowReciboModal] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      const res = await getAlertasMora();
      setDataAlertas(res.data);
    } catch (error) {
      console.error('Error al cargar alertas de mora:', error);
      toast.error('Error al cargar el tablero de morosidad');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarReporteMorosos = async () => {
    setDescargandoPDF(true);
    try {
      const response = await descargarReporteMorososPDF();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_clientes_morosos_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Informe oficial de morosidad (>31 días) descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar reporte de morosos:', error);
      toast.error('No se pudo generar el reporte en PDF.');
    } finally {
      setDescargandoPDF(false);
    }
  };

  const handleCobrarAlerta = (alerta) => {
    setContratoCobro({
      id_contrato: alerta.contrato_id,
      numero_contrato: alerta.numero_contrato,
      cliente_nombre: alerta.cliente_nombre
    });
    setShowReciboModal(true);
  };

  const morososMayores31 = dataAlertas
    ? (dataAlertas.morosos_mayores_31 || [...(dataAlertas.operativo || []), ...(dataAlertas.extrajudicial || [])])
    : [];
  const totalMorosos31 = morososMayores31.length;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
            Tablero de Alertas de Cobranza y Mora
          </h2>
          <small className="text-muted">
            Clasificación automatizada de riesgo de morosidad para gestión de cobro oportuna
          </small>
        </div>
        <button
          type="button"
          className="btn btn-danger d-flex align-items-center gap-2 shadow-sm px-3 py-2 fw-semibold"
          onClick={handleDescargarReporteMorosos}
          disabled={descargandoPDF}
          title="Generar informe en PDF con los clientes morosos con más de 31 días de atraso"
        >
          {descargandoPDF ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Generando Informe PDF...</span>
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
              <span>Descargar Reporte de Clientes Morosos (&gt;31 días)</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Evaluando mora y estados de contratos...</p>
        </div>
      ) : dataAlertas ? (
        <>
          {/* Tarjetas de Resumen de Riesgo */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="p-3 border rounded bg-danger bg-opacity-10 border-danger text-center shadow-sm">
                <small className="text-danger d-block fw-bold">MOROSOS (&gt; 31 DÍAS)</small>
                <strong className="fs-3 text-danger">{totalMorosos31} Casos</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-warning bg-opacity-10 border-warning text-center">
                <small className="text-warning text-dark d-block fw-bold">OPERATIVO (31-90 Días)</small>
                <strong className="fs-3 text-warning text-dark">{dataAlertas.totales?.total_operativo || 0}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-dark bg-opacity-10 border-dark text-center">
                <small className="text-dark d-block fw-bold">EXTRAJUDICIAL (&gt;90 Días)</small>
                <strong className="fs-3 text-dark">{dataAlertas.totales?.total_extrajudicial || 0}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-success bg-opacity-10 border-success text-center">
                <small className="text-success d-block fw-bold">PREVENTIVO (1-30 Días)</small>
                <strong className="fs-3 text-success">{dataAlertas.totales?.total_preventivo || 0}</strong>
              </div>
            </div>
          </div>

          {/* Navegación por Pestañas de Riesgo */}
          <ul className="nav nav-pills mb-4 gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'morosos' ? 'active bg-danger text-white fw-bold shadow-sm' : 'btn-outline-danger'}`}
                onClick={() => setActiveTab('morosos')}
              >
                <i className="bi bi-person-x-fill me-1"></i> Cartera Morosa Oficial (&gt;31 Días) ({totalMorosos31})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'operativo' ? 'active bg-warning text-dark fw-bold shadow-sm' : 'btn-outline-warning'}`}
                onClick={() => setActiveTab('operativo')}
              >
                <i className="bi bi-telephone-outbound me-1"></i> Cobranza Operativa (31-90 Días) ({dataAlertas.operativo?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'extrajudicial' ? 'active bg-dark text-white fw-bold shadow-sm' : 'btn-outline-dark'}`}
                onClick={() => setActiveTab('extrajudicial')}
              >
                <i className="bi bi-exclamation-octagon me-1"></i> Cobranza Extrajudicial (&gt;90 Días) ({dataAlertas.extrajudicial?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'preventivo' ? 'active bg-success text-white fw-bold shadow-sm' : 'btn-outline-success'}`}
                onClick={() => setActiveTab('preventivo')}
              >
                <i className="bi bi-shield-check me-1"></i> Cobranza Preventiva (1-30 Días) ({dataAlertas.preventivo?.length || 0})
              </button>
            </li>
          </ul>

          {/* Contenido según Pestaña Activa */}
          {activeTab === 'morosos' && (
            <div>
              <div className="alert alert-danger bg-danger bg-opacity-10 border-danger d-flex justify-content-between align-items-center mb-4 p-3 rounded">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill text-danger fs-4"></i>
                  <div>
                    <strong className="text-danger d-block">Reporte Exclusivo de Clientes Morosos (&gt;31 Días de Atraso):</strong>
                    <span className="small text-dark">
                      Este informe agrupa a los clientes que han superado el plazo de cobro preventivo (1-30 días) y requieren gestiones activas de cobranza operativa o extrajudicial.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-danger d-flex align-items-center gap-1 shadow-sm flex-shrink-0"
                  onClick={handleDescargarReporteMorosos}
                  disabled={descargandoPDF}
                >
                  <i className="bi bi-file-earmark-pdf-fill"></i>
                  <span>Exportar PDF</span>
                </button>
              </div>

              <div className="row g-3">
                {morososMayores31.length === 0 ? (
                  <div className="col-12 text-center py-5 text-muted border rounded bg-light">
                    <i className="bi bi-check-circle display-4 text-success mb-2 d-block"></i>
                    No se registran clientes con morosidad mayor a 31 días. Toda la cartera está al día o en plazo preventivo.
                  </div>
                ) : (
                  morososMayores31.map((item, idx) => (
                    <div className="col-md-6 col-lg-4" key={idx}>
                      <AlertaMoraCard alerta={item} onRegistrarPago={handleCobrarAlerta} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'preventivo' && (
            <div className="row g-3">
              {dataAlertas.preventivo?.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted border rounded bg-light">
                  <i className="bi bi-check-circle display-4 text-success mb-2 d-block"></i>
                  No hay contratos en cobranza preventiva.
                </div>
              ) : (
                dataAlertas.preventivo?.map((item, idx) => (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <AlertaMoraCard alerta={item} onRegistrarPago={handleCobrarAlerta} />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'operativo' && (
            <div className="row g-3">
              {dataAlertas.operativo?.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted border rounded bg-light">
                  <i className="bi bi-check-circle display-4 text-success mb-2 d-block"></i>
                  No hay contratos en cobranza operativa.
                </div>
              ) : (
                dataAlertas.operativo?.map((item, idx) => (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <AlertaMoraCard alerta={item} onRegistrarPago={handleCobrarAlerta} />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'extrajudicial' && (
            <div className="row g-3">
              {dataAlertas.extrajudicial?.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted border rounded bg-light">
                  <i className="bi bi-check-circle display-4 text-success mb-2 d-block"></i>
                  No hay contratos en cobranza extrajudicial.
                </div>
              ) : (
                dataAlertas.extrajudicial?.map((item, idx) => (
                  <div className="col-md-6 col-lg-4" key={idx}>
                    <AlertaMoraCard alerta={item} onRegistrarPago={handleCobrarAlerta} />
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Modal de Recibo de Caja */}
      <ReciboFormModal
        show={showReciboModal}
        contrato={contratoCobro}
        onClose={() => setShowReciboModal(false)}
        onSuccess={cargarAlertas}
      />
    </div>
  );
};

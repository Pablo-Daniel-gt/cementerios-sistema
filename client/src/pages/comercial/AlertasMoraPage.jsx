import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAlertasMora } from '../../api/comercial.api';
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
  const [activeTab, setActiveTab] = useState('preventivo');

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

  const handleCobrarAlerta = (alerta) => {
    setContratoCobro({
      id_contrato: alerta.contrato_id,
      numero_contrato: alerta.numero_contrato,
      cliente_nombre: alerta.cliente_nombre
    });
    setShowReciboModal(true);
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
            Tablero de Alertas de Cobranza y Mora
          </h2>
          <small className="text-muted">
            Clasificación automatizada de riesgo de morosidad para gestión de cobro oportuna
          </small>
        </div>
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
              <div className="p-3 border rounded bg-light text-center">
                <small className="text-muted d-block fw-bold">TOTAL MOROSIDAD</small>
                <strong className="fs-3 text-dark">{dataAlertas.totales?.total_alertas || 0} Casos</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-success bg-opacity-10 border-success text-center">
                <small className="text-success d-block fw-bold">PREVENTIVO (1-30 Días)</small>
                <strong className="fs-3 text-success">{dataAlertas.totales?.total_preventivo || 0}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-warning bg-opacity-10 border-warning text-center">
                <small className="text-warning text-dark d-block fw-bold">OPERATIVO (31-90 Días)</small>
                <strong className="fs-3 text-warning text-dark">{dataAlertas.totales?.total_operativo || 0}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border rounded bg-danger bg-opacity-10 border-danger text-center">
                <small className="text-danger d-block fw-bold">EXTRAJUDICIAL (&gt;90 Días)</small>
                <strong className="fs-3 text-danger">{dataAlertas.totales?.total_extrajudicial || 0}</strong>
              </div>
            </div>
          </div>

          {/* Navegación por Pestañas de Riesgo */}
          <ul className="nav nav-pills mb-4 gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'preventivo' ? 'active bg-success' : 'btn-outline-success'}`}
                onClick={() => setActiveTab('preventivo')}
              >
                <i className="bi bi-shield-check me-1"></i> Cobranza Preventiva ({dataAlertas.preventivo?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'operativo' ? 'active bg-warning text-dark' : 'btn-outline-warning'}`}
                onClick={() => setActiveTab('operativo')}
              >
                <i className="bi bi-telephone-outbound me-1"></i> Cobranza Operativa ({dataAlertas.operativo?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'extrajudicial' ? 'active bg-danger' : 'btn-outline-danger'}`}
                onClick={() => setActiveTab('extrajudicial')}
              >
                <i className="bi bi-exclamation-octagon me-1"></i> Cobranza Extrajudicial ({dataAlertas.extrajudicial?.length || 0})
              </button>
            </li>
          </ul>

          {/* Contenido según Pestaña Activa */}
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

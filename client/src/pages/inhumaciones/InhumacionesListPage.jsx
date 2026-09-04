import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRegistrosInhumacion, eliminarRegistroInhumacion } from '../../api/inhumaciones.api';
import { InhumacionFormModal } from '../../components/inhumaciones/InhumacionFormModal';
import { ExhumacionModal } from '../../components/inhumaciones/ExhumacionModal';
import { VisorPDFModal } from '../../components/inhumaciones/VisorPDFModal';

export const InhumacionesListPage = () => {
  const location = useLocation();
  const difuntoPreseleccionado = location.state?.difunto_preseleccionado || null;

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [search, setSearch] = useState('');

  // Modales
  const [showInhumacionModal, setShowInhumacionModal] = useState(!!difuntoPreseleccionado);
  const [registroExhumar, setRegistroExhumar] = useState(null);
  const [visorPdfData, setVisorPdfData] = useState(null); // { title, pdfUrl }

  useEffect(() => {
    cargarRegistros();
  }, [filtroEstado]);

  const cargarRegistros = async (searchQuery = search) => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (searchQuery) params.search = searchQuery;

      const res = await getRegistrosInhumacion(params);
      setRegistros(res.data || []);
    } catch (error) {
      console.error('Error al cargar inhumaciones:', error);
      toast.error('No se pudo cargar la lista de inhumaciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    cargarRegistros(val);
  };

  const handleEliminarRegistro = async (id, difuntoNombre) => {
    if (window.confirm(`¿Está seguro de eliminar el registro de inhumación de ${difuntoNombre}?`)) {
      try {
        await eliminarRegistroInhumacion(id);
        toast.success('Registro de inhumación eliminado.');
        cargarRegistros();
      } catch (error) {
        console.error('Error al eliminar registro:', error);
      }
    }
  };

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'ACTIVA':
        return <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i> Activa</span>;
      case 'EXHUMADO':
        return <span className="badge bg-warning text-dark"><i className="bi bi-box-arrow-up-right me-1"></i> Exhumado</span>;
      case 'TRASLADADO':
        return <span className="badge bg-info text-dark"><i className="bi bi-arrow-left-right me-1"></i> Trasladado</span>;
      default:
        return <span className="badge bg-secondary">{estado}</span>;
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-flower1 text-success me-2"></i>
            Control Operativo de Inhumaciones y Exhumaciones
          </h2>
          <small className="text-muted">
            Registro de sepelios, expediente digital RENAP/MSPAS y procesos de exhumación/traslado
          </small>
        </div>
        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={() => setShowInhumacionModal(true)}
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Nueva Inhumación / Sepelio</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por difunto, CUI, nicho o contrato..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-center gap-2">
                <label className="form-label fw-bold text-secondary mb-0 small text-nowrap">
                  Estado Inhumación:
                </label>
                <select
                  className="form-select"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos los Estados</option>
                  <option value="ACTIVA">Solo Activas (Ocupados)</option>
                  <option value="EXHUMADO">Exhumados</option>
                  <option value="TRASLADADO">Trasladados</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2 text-muted">Cargando expediente de sepelios...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x display-4 mb-2 d-block"></i>
              No se encontraron registros de inhumación.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>No. Sepelio</th>
                    <th>Persona Fallecida</th>
                    <th>Nicho Asignado</th>
                    <th>No. Contrato</th>
                    <th>Fecha y Hora Sepelio</th>
                    <th>Anexos Legales (PDF)</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const nombreDifunto = r.difunto_detalle
                      ? `${r.difunto_detalle.nombres} ${r.difunto_detalle.apellidos}`
                      : 'N/A';

                    return (
                      <tr key={r.id}>
                        <td className="fw-bold text-success">#{r.id}</td>
                        <td>
                          <div className="fw-bold text-dark">{nombreDifunto}</div>
                          <small className="text-muted">
                            {r.difunto_detalle?.cui ? `CUI: ${r.difunto_detalle.cui}` : 'Sin CUI'}
                          </small>
                        </td>
                        <td>
                          <span className="fw-bold text-primary">{r.espacio_codigo}</span>
                          <small className="d-block text-muted">
                            {r.sector_nombre} — {r.estructura_nombre}
                          </small>
                        </td>
                        <td>
                          <span className="fw-bold">{r.contrato_numero}</span>
                          <small className="d-block text-muted truncate-text" style={{ maxWidth: '180px' }}>
                            {r.cliente_nombre}
                          </small>
                        </td>
                        <td>
                          {new Date(r.fecha_sepelio).toLocaleString('es-GT', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {r.acta_renap_pdf && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-danger d-inline-flex align-items-center gap-1 text-start py-0 px-2"
                                onClick={() =>
                                  setVisorPdfData({
                                    title: `Acta RENAP - ${nombreDifunto}`,
                                    pdfUrl: r.acta_renap_pdf,
                                  })
                                }
                              >
                                <i className="bi bi-file-earmark-pdf-fill"></i>
                                <span className="small">Acta RENAP</span>
                              </button>
                            )}
                            {r.certificado_mspas_pdf && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-info d-inline-flex align-items-center gap-1 text-start py-0 px-2"
                                onClick={() =>
                                  setVisorPdfData({
                                    title: `Certificado MSPAS - ${nombreDifunto}`,
                                    pdfUrl: r.certificado_mspas_pdf,
                                  })
                                }
                              >
                                <i className="bi bi-file-earmark-medical-fill"></i>
                                <span className="small">MSPAS</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{getBadgeEstado(r.estado_inhumacion)}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            {r.estado_inhumacion === 'ACTIVA' && (
                              <button
                                type="button"
                                className="btn btn-outline-warning text-dark fw-semibold"
                                title="Procesar Exhumación o Traslado"
                                onClick={() => setRegistroExhumar(r)}
                              >
                                <i className="bi bi-box-arrow-up-right me-1"></i> Exhumar
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Eliminar Registro"
                              onClick={() => handleEliminarRegistro(r.id, nombreDifunto)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Inhumaciones */}
      {showInhumacionModal && (
        <InhumacionFormModal
          difuntoPreseleccionado={difuntoPreseleccionado}
          onClose={() => setShowInhumacionModal(false)}
          onSuccess={() => cargarRegistros()}
        />
      )}

      {/* Modal Exhumación / Traslado */}
      {registroExhumar && (
        <ExhumacionModal
          registro={registroExhumar}
          onClose={() => setRegistroExhumar(null)}
          onSuccess={() => cargarRegistros()}
        />
      )}

      {/* Modal Visor de PDFs */}
      {visorPdfData && (
        <VisorPDFModal
          title={visorPdfData.title}
          pdfUrl={visorPdfData.pdfUrl}
          onClose={() => setVisorPdfData(null)}
        />
      )}
    </div>
  );
};

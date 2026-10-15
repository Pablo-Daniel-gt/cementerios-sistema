import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMisDifuntos } from '../../api/inhumaciones.api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const MisDifuntosPage = () => {
  const { user } = useAuth();
  const [difuntos, setDifuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  useEffect(() => {
    cargarDifuntos();
  }, []);

  const cargarDifuntos = async () => {
    setLoading(true);
    try {
      const res = await getMisDifuntos();
      setDifuntos(res.data || []);
    } catch (err) {
      console.error('Error al cargar difuntos del cliente:', err);
      toast.error('No se pudo cargar la lista de difuntos asociados a sus contratos.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado reactivo en memoria
  const difuntosFiltrados = useMemo(() => {
    return difuntos.filter((d) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        (d.nombre_completo && d.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.cui && d.cui.includes(searchTerm)) ||
        (d.codigo_nicho && d.codigo_nicho.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.numero_contrato && d.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado =
        filtroEstado === 'TODOS' ||
        d.estado_inhumacion === filtroEstado;

      return matchSearch && matchEstado;
    });
  }, [difuntos, searchTerm, filtroEstado]);

  return (
    <div className="container-fluid py-2">
      {/* Encabezado Principal */}
      <div className="bg-primary text-white p-4 rounded-3 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary p-3 rounded-circle shadow-sm">
              <i className="bi bi-flower1 fs-2 text-warning"></i>
            </div>
            <div>
              <h3 className="fw-bold mb-1">Mis Familiares Difuntos</h3>
              <p className="mb-0 text-white-50">
                Consulta privada y memorial de inhumaciones realizadas en sus nichos adquiridos.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/portal-cliente"
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
              title="Volver al Portal Principal"
            >
              <i className="bi bi-arrow-left"></i>
              <span>Volver a Mi Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6 col-lg-7">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar por nombre, DPI/CUI, código de nicho o contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-4 col-lg-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Inhumación Activa</option>
                <option value="EXHUMADA">Exhumado</option>
                <option value="TRASLADADA">Trasladado</option>
              </select>
            </div>

            <div className="col-md-2 col-lg-2 text-md-end">
              <button
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={cargarDifuntos}
                disabled={loading}
                title="Actualizar lista"
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando registros oficiales de inhumaciones...</p>
        </div>
      ) : difuntos.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-flower1 display-4 text-secondary mb-3 d-block opacity-50"></i>
            <h5 className="fw-semibold text-dark">No tiene difuntos registrados actualmente</h5>
            <p className="text-muted small mx-auto" style={{ maxWidth: '520px' }}>
              Cuando se formalice una inhumación en alguno de sus nichos o contratos asignados, los datos de sus seres queridos se mostrarán en este apartado de forma privada y segura.
            </p>
            <Link to="/portal-cliente" className="btn btn-primary btn-sm px-4 mt-2">
              Ver Mis Contratos y Nichos
            </Link>
          </div>
        </div>
      ) : difuntosFiltrados.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-search display-5 text-muted mb-3 d-block"></i>
            <h5 className="fw-semibold text-dark">No se encontraron resultados</h5>
            <p className="text-muted small">
              No hay registros que coincidan con el término de búsqueda <strong>"{searchTerm}"</strong>.
            </p>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { setSearchTerm(''); setFiltroEstado('TODOS'); }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="text-muted small">
                Mostrando <strong>{difuntosFiltrados.length}</strong> de <strong>{difuntos.length}</strong> registro(s)
              </span>
              <span className="badge bg-light text-dark border">
                <i className="bi bi-shield-lock-fill text-success me-1"></i>
                Vista Exclusiva de Titular (Solo Lectura)
              </span>
            </div>
          </div>

          {difuntosFiltrados.map((d) => (
            <div key={d.id_registro} className="col-12">
              <div className="card border-0 shadow-sm h-100">
                {/* Header de la tarjeta */}
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                      <i className="bi bi-person-fill fs-5"></i>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold text-dark">{d.nombre_completo}</h5>
                      <small className="text-muted">
                        DPI / CUI: <strong className="text-secondary">{d.cui || 'No consignado'}</strong>
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge px-3 py-2 ${
                        d.estado_inhumacion === 'ACTIVA'
                          ? 'bg-success'
                          : d.estado_inhumacion === 'EXHUMADA'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                      }`}
                    >
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Inhumación {d.estado_inhumacion_display || d.estado_inhumacion}
                    </span>
                  </div>
                </div>

                {/* Cuerpo de la tarjeta */}
                <div className="card-body p-4">
                  <div className="row g-4">
                    {/* Ubicación y Nicho */}
                    <div className="col-md-4 col-sm-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <div className="text-muted small mb-1 fw-semibold text-uppercase">
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                          Ubicación de Reposo
                        </div>
                        <h6 className="fw-bold text-primary mb-1">
                          Nicho: {d.codigo_nicho}
                        </h6>
                        <div className="small text-secondary">
                          <div><strong>Sector:</strong> {d.sector_nombre || 'N/A'}</div>
                          <div><strong>Estructura:</strong> {d.estructura_nombre || 'N/A'}</div>
                          <div><strong>Fila/Columna:</strong> {d.posicion || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Fechas Importantes */}
                    <div className="col-md-4 col-sm-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <div className="text-muted small mb-1 fw-semibold text-uppercase">
                          <i className="bi bi-calendar-event-fill text-info me-1"></i>
                          Fechas Registradas
                        </div>
                        <div className="small">
                          <div className="mb-1">
                            <span className="text-muted">Fecha de Sepelio:</span>{' '}
                            <strong className="text-dark">{d.fecha_sepelio || 'Pendiente'}</strong>
                          </div>
                          <div className="mb-1">
                            <span className="text-muted">Fecha de Defunción:</span>{' '}
                            <strong className="text-secondary">{d.fecha_defuncion || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-muted">Hora de Inhumación:</span>{' '}
                            <span className="text-secondary">{d.hora_sepelio || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vínculo Comercial y Legal */}
                    <div className="col-md-4 col-sm-12">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <div className="text-muted small mb-1 fw-semibold text-uppercase">
                          <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                          Contrato y Registro Legal
                        </div>
                        <div className="small">
                          <div className="mb-1">
                            <span className="text-muted">Contrato Titular:</span>{' '}
                            <strong className="text-dark">{d.numero_contrato || 'N/A'}</strong>
                          </div>
                          <div className="mb-1">
                            <span className="text-muted">Causa de Defunción:</span>{' '}
                            <span className="text-secondary">{d.causa_muerte || 'No especificada'}</span>
                          </div>
                          <div>
                            <span className="text-muted">Orden Judicial / Médica:</span>{' '}
                            <span className="text-secondary">{d.numero_informe_medico || 'Constancia RENAP'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones si las hay */}
                  {d.observaciones && (
                    <div className="mt-3 p-3 bg-light rounded border">
                      <small className="text-muted fw-bold d-block mb-1">
                        <i className="bi bi-chat-left-text me-1"></i>
                        Observaciones y Anotaciones Oficiales:
                      </small>
                      <p className="small text-secondary mb-0">
                        {d.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer de la tarjeta con aviso legal */}
                <div className="card-footer bg-light border-top py-2 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <small className="text-muted">
                    <i className="bi bi-shield-check text-success me-1"></i>
                    Inhumación registrada y certificada ante el Registro Nacional de las Personas (RENAP).
                  </small>
                  <small className="text-muted fst-italic">
                    Información protegida y de uso exclusivo del titular de contrato.
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

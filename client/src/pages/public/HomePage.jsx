import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buscarMemorialPublico, getCatalogoEspaciosPublico } from '../../api/publico.api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const HomePage = () => {
  const { isAuthenticated, role } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  // Carga inicial de registros memoriales recientes y catálogo
  useEffect(() => {
    cargarRegistrosIniciales();
    cargarCatalogo();
  }, []);

  const cargarRegistrosIniciales = async () => {
    try {
      setLoading(true);
      const res = await buscarMemorialPublico('');
      setResultados(res.data || []);
    } catch (err) {
      console.error('Error al cargar registros públicos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogo = async () => {
    try {
      const res = await getCatalogoEspaciosPublico();
      setCatalogo(res.data || []);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await buscarMemorialPublico(query.trim());
      setResultados(res.data || []);
      if (res.data?.length === 0) {
        toast.info('No se encontraron registros memoriales con ese criterio.');
      }
    } catch (err) {
      toast.error('Ocurrió un error al buscar en los registros memoriales.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setQuery('');
    setHasSearched(false);
    cargarRegistrosIniciales();
  };

  return (
    <div>
      {/* 1. HERO BANNER EMPÁTICO Y BUSCADOR MEMORIAL */}
      <section className="hero-banner-public py-5 text-center position-relative shadow-sm">
        <div className="container py-4 position-relative" style={{ maxWidth: '900px', zIndex: 2 }}>
          <div className="mb-3 d-inline-flex p-3 rounded-circle bg-white bg-opacity-10 border border-white border-opacity-15 shadow-sm">
            <i className="bi bi-flower1 text-warning display-5"></i>
          </div>
          <h1 className="fw-bold text-white mb-3 display-6" style={{ letterSpacing: '-0.02em' }}>
            Servicios Memoriales y Plataforma Pública de Consulta
          </h1>
          <p className="lead text-white-50 mb-4 fs-6" style={{ maxWidth: '720px', margin: '0 auto' }}>
            Acompañamiento respetuoso, transparencia jurídica y preservación de la memoria familiar en Huehuetenango.
          </p>

          {/* Formulario de Búsqueda Centralizado */}
          <form onSubmit={handleSearch} className="card p-2 shadow-lg border-0 rounded-4 mx-auto bg-white" style={{ maxWidth: '680px' }}>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                <i className="bi bi-search fs-5 text-secondary"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 shadow-none fs-6 text-dark"
                placeholder="Buscar por nombre de difunto o CUI / DPI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="btn btn-link text-muted pe-2"
                  onClick={handleLimpiar}
                  title="Limpiar búsqueda"
                >
                  <i className="bi bi-x-circle-fill fs-5"></i>
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-secondary-custom px-4 fs-6 fw-semibold d-flex align-items-center gap-2 rounded-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-search"></i>
                    <span>Buscar Registro</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="d-flex flex-wrap justify-content-center gap-3 mt-3 text-white-50 small">
            <span><i className="bi bi-shield-check text-success me-1"></i> Consulta pública y gratuita</span>
            <span>•</span>
            <span><i className="bi bi-geo-alt-fill text-danger me-1"></i> Ubicación exacta en camposanto</span>
          </div>
        </div>
      </section>

      {/* 2. RESULTADOS DE BÚSQUEDA Y ACCESOS RÁPIDOS */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Columna Izquierda: Resultados de Inhumaciones */}
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-person-badge-fill text-success fs-4"></i>
                  {hasSearched ? 'Registros Coincidentes' : 'Registros Memoriales Recientes'} ({resultados.length})
                </h5>
                {hasSearched && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={handleLimpiar}>
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Restablecer
                  </button>
                )}
              </div>

              {loading ? (
                <div className="card p-5 text-center border-0 shadow-sm rounded-3">
                  <div className="spinner-border text-success mx-auto mb-3" role="status"></div>
                  <p className="text-muted mb-0">Consultando registros en la base de datos...</p>
                </div>
              ) : resultados.length === 0 ? (
                <div className="card p-5 text-center border-0 shadow-sm text-muted rounded-4 bg-white">
                  <i className="bi bi-folder-x fs-1 text-secondary mb-3"></i>
                  <h6 className="fw-bold text-dark">No se encontraron registros memoriales</h6>
                  <p className="small mb-3 text-muted">
                    No hubo coincidencias con el término <strong>"{query}"</strong>. Verifique la ortografía o comuníquese a nuestras oficinas para asistencia personalizada.
                  </p>
                  <Link to="/contacto" className="btn btn-outline-primary btn-sm align-self-center">
                    <i className="bi bi-headset me-1"></i> Contactar Asesoría
                  </Link>
                </div>
              ) : (
                <div className="row g-3">
                  {resultados.map((item) => (
                    <div key={item.id} className="col-md-6">
                      <div className="card card-empathic p-3.5 h-100 border-start border-4 border-success d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-light text-secondary border">
                            <i className="bi bi-card-text me-1"></i> CUI: {item.cui}
                          </span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {item.estado}
                          </span>
                        </div>

                        <h6 className="fw-bold mb-1 text-primary-custom" style={{ fontSize: '1.05rem' }}>
                          {item.nombre_completo}
                        </h6>

                        <div className="text-muted small mb-2 d-flex flex-column gap-1">
                          <div>
                            <i className="bi bi-calendar2-heart text-danger me-1.5"></i>
                            <strong>Defunción:</strong> {item.fecha_defuncion}
                          </div>
                          <div>
                            <i className="bi bi-clock-history text-secondary me-1.5"></i>
                            <strong>Inhumación:</strong> {item.fecha_sepelio}
                          </div>
                        </div>

                        <div className="mt-auto pt-2.5 border-top text-secondary small fw-medium d-flex align-items-center gap-1.5 bg-light bg-opacity-50 p-2 rounded-2">
                          <i className="bi bi-geo-alt-fill text-danger fs-6"></i>
                          <span>{item.ubicacion}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: Tarjetas de Acción Rápida */}
            <div className="col-lg-4">
              <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                Servicios y Accesos
              </h5>

              {/* Tarjeta 1: Catálogo de Nichos */}
              <div className="card card-empathic p-4 mb-3 border-0 bg-white">
                <div className="d-flex align-items-start gap-3 mb-2">
                  <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                    <i className="bi bi-grid-3x3-gap-fill fs-3"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Catálogo de Espacios</h6>
                    <p className="text-muted small mb-0">
                      Nichos individuales, módulos familiares y mausoleos a perpetuidad.
                    </p>
                  </div>
                </div>
                <Link to="/servicios" className="btn btn-outline-primary btn-sm w-100 mt-2 fw-semibold">
                  Explorar Catálogo de Inmuebles <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>

              {/* Tarjeta 2: Cotizador */}
              <div className="card card-empathic p-4 mb-3 border-0 bg-white">
                <div className="d-flex align-items-start gap-3 mb-2">
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                    <i className="bi bi-calculator-fill fs-3"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Simulador de Financiamiento</h6>
                    <p className="text-muted small mb-0">
                      Calcule cuotas personalizadas desde 24 hasta 60 meses en Quetzales (Q).
                    </p>
                  </div>
                </div>
                <Link to="/cotizador-publico" className="btn btn-outline-success btn-sm w-100 mt-2 fw-semibold">
                  Simular Plan de Pago <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISTA PREVIA DE CATÁLOGO Y ESPACIOS */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill uppercase fw-bold mb-2">
              Inmuebles y Espacios
            </span>
            <h2 className="fw-bold text-dark">Opciones Diseñadas para Cada Familia</h2>
            <p className="text-muted small">
              Estructuras construidas con estándares arquitectónicos de primer nivel y mantenimiento integral garantizado.
            </p>
          </div>

          <div className="row g-4">
            {catalogo.slice(0, 3).map((item) => (
              <div key={item.id} className="col-lg-4 col-md-6">
                <div className="card card-empathic h-100 p-4 d-flex flex-column border-0 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      {item.badge || item.categoria}
                    </span>
                    <span className="text-muted small">
                      <i className="bi bi-person-fill me-1"></i> {item.capacidad}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{item.tipo}</h5>
                  <p className="text-muted small mb-3">{item.descripcion}</p>

                  <div className="bg-light p-3 rounded-3 mb-4 mt-auto">
                    <div className="text-muted small">Precio base desde:</div>
                    <div className="fs-4 fw-bold text-success">
                      Q{Number(item.precio_base).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-muted small">
                      Cuotas estimadas desde <strong className="text-dark">Q{Number(item.cuota_minima_mes).toFixed(2)}/mes</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/cotizador-publico', { state: { monto: item.precio_base, tipo: item.tipo } })}
                    className="btn btn-outline-primary w-100 fw-semibold btn-sm"
                  >
                    Cotizar este Espacio
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <Link to="/servicios" className="btn btn-primary px-4 py-2">
              Ver Catálogo Completo de Servicios <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. VALORES INSTITUCIONALES Y COMPROMISO */}
      <section className="py-5 bg-app">
        <div className="container py-3">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4 bg-white rounded-4 shadow-sm h-100 border">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex mb-3">
                  <i className="bi bi-shield-check fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Certeza y Respaldo Legal</h5>
                <p className="text-muted small mb-0">
                  Documentación formal, contratos de derecho de uso perpetuo y registro digitalizado conforme a la normativa de RENAP y MSPAS.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 bg-white rounded-4 shadow-sm h-100 border">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex mb-3">
                  <i className="bi bi-tree-fill fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Entorno Sereno y Digno</h5>
                <p className="text-muted small mb-0">
                  Instalaciones con mantenimiento paisajístico permanente, iluminación adecuada, seguridad y áreas de recogimiento familiar.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 bg-white rounded-4 shadow-sm h-100 border">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex mb-3">
                  <i className="bi bi-heart-pulse-fill fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Atención Familiar Inmediata</h5>
                <p className="text-muted small mb-0">
                  Línea de asistencia 24/7 para emergencias, asesoría personalizada en trámites y facilidades de pago adaptadas a cada necesidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

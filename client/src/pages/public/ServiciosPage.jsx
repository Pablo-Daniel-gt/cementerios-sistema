import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCatalogoEspaciosPublico } from '../../api/publico.api';

export const ServiciosPage = () => {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      setLoading(true);
      const res = await getCatalogoEspaciosPublico();
      setCatalogo(res.data || []);
    } catch (err) {
      console.error('Error al cargar servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const serviciosAdicionales = [
    {
      titulo: 'Inhumación y Sepelio Digno',
      descripcion: 'Coordinación completa del acto de sepelio, apertura, sellado hermético y asistencia del personal del camposanto con total solemnidad.',
      icono: 'bi-flower2'
    },
    {
      titulo: 'Trámites y Certificados RENAP / MSPAS',
      descripcion: 'Asesoría jurídica y digitalización de actas de defunción y certificados sanitarios para total respaldo legal.',
      icono: 'bi-file-earmark-check-fill'
    },
    {
      titulo: 'Exhumaciones y Traslados Oficiales',
      descripcion: 'Procedimientos técnicos y sanitarios autorizados para traslados interdepartamentales o reubicaciones de restos.',
      icono: 'bi-arrow-left-right'
    },
    {
      titulo: 'Mantenimiento y Jardinería Perpetua',
      descripcion: 'Cuidado continuo de áreas verdes, limpieza de pabellones, seguridad 24 horas y preservación de monumentos.',
      icono: 'bi-tree'
    }
  ];

  return (
    <div>
      {/* Header de Sección */}
      <section className="bg-navy-dark text-white py-5 text-center">
        <div className="container py-3">
          <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold mb-2">
            Catálogo Oficial de Inmuebles
          </span>
          <h1 className="fw-bold display-6 mb-2">Servicios y Espacios Memoriales</h1>
          <p className="lead text-white-50 fs-6 mx-auto mb-0" style={{ maxWidth: '680px' }}>
            Opciones pensadas para proteger la paz de su familia con planes de financiamiento a su medida y derecho de uso a perpetuidad en Huehuetenango.
          </p>
        </div>
      </section>

      {/* Catálogo Principal de Espacios */}
      <section className="py-5">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="text-muted mt-2">Cargando catálogo de espacios...</p>
            </div>
          ) : (
            <div className="row g-4">
              {catalogo.map((item) => (
                <div key={item.id} className="col-lg-6">
                  <div className="card card-empathic p-4 h-100 border-0 shadow-sm d-flex flex-column bg-white">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle mb-1">
                          {item.categoria}
                        </span>
                        <h4 className="fw-bold text-dark mb-0">{item.tipo}</h4>
                      </div>
                      <div className="p-3 bg-light rounded-circle text-success fs-3">
                        <i className={`bi ${item.icono || 'bi-grid-3x3'}`}></i>
                      </div>
                    </div>

                    <p className="text-muted small mb-3">{item.descripcion}</p>

                    <h6 className="fw-bold text-secondary small text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
                      Características Incluidas:
                    </h6>
                    <ul className="list-unstyled mb-4 d-flex flex-column gap-1.5 small">
                      {item.caracteristicas?.map((car, idx) => (
                        <li key={idx} className="d-flex align-items-center gap-2 text-secondary">
                          <i className="bi bi-check-circle-fill text-success fs-6"></i>
                          <span>{car}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                      <div>
                        <div className="text-muted small">Inversión Base:</div>
                        <div className="fs-4 fw-bold text-primary-custom">
                          Q{Number(item.precio_base).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-muted small">
                          Cuotas desde <strong className="text-success">Q{Number(item.cuota_minima_mes).toFixed(2)} / mes</strong>
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        <button
                          onClick={() => navigate('/cotizador-publico', { state: { monto: item.precio_base, tipo: item.tipo } })}
                          className="btn btn-secondary-custom btn-sm px-4 fw-semibold"
                        >
                          <i className="bi bi-calculator me-1"></i> Cotizar Plan
                        </button>
                        <Link to="/contacto" className="btn btn-outline-secondary btn-sm text-center">
                          Solicitar Asesoría
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Servicios Complementarios */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 className="fw-bold text-dark">Servicios Operativos y Asistencia Integral</h3>
            <p className="text-muted small">
              Brindamos soporte completo en cada etapa del proceso, garantizando tranquilidad y apego legal.
            </p>
          </div>

          <div className="row g-4">
            {serviciosAdicionales.map((serv, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div className="p-4 bg-app rounded-4 h-100 border text-center d-flex flex-column align-items-center">
                  <div className="p-3 bg-white rounded-circle text-primary shadow-sm mb-3">
                    <i className={`bi ${serv.icono} fs-3 text-success`}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-2">{serv.titulo}</h6>
                  <p className="text-muted small mb-0">{serv.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="py-5 text-center bg-app">
        <div className="container py-3" style={{ maxWidth: '750px' }}>
          <h3 className="fw-bold text-dark mb-3">¿Desea una cotización personalizada o visita guiada?</h3>
          <p className="text-muted small mb-4">
            Nuestros asesores de previsión familiar están a su disposición para resolver cualquier duda y orientarle en la elección del espacio ideal.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link to="/cotizador-publico" className="btn btn-primary px-4 py-2">
              <i className="bi bi-calculator me-1.5"></i> Ir al Cotizador Interactivo
            </Link>
            <Link to="/contacto" className="btn btn-outline-secondary px-4 py-2">
              <i className="bi bi-headset me-1.5"></i> Contactar a un Asesor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

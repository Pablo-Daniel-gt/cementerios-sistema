import { Link } from 'react-router-dom';

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-public pt-5 pb-4 mt-auto">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Columna 1: Marca y Misión */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-10 rounded-circle" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-flower1 text-warning fs-5"></i>
              </div>
              <span className="fw-bold text-white fs-5" style={{ letterSpacing: '-0.02em' }}>
                Camposanto Los Robles
              </span>
            </div>
            <p className="text-white-50 small mb-3 leading-relaxed">
              Dedicados a brindar acompañamiento digno, respetuoso y profesional a las familias de Huehuetenango en la preservación y honra de la memoria de sus seres queridos.
            </p>
            <div className="d-flex align-items-center gap-2 text-white-50 small">
              <i className="bi bi-shield-check text-success fs-5"></i>
              <span>Garantía de perpetuidad y transparencia legal.</span>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Navegación
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/" className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-chevron-right text-success small"></i> Inicio
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-chevron-right text-success small"></i> Servicios y Nichos
                </Link>
              </li>
              <li>
                <Link to="/cotizador-publico" className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-chevron-right text-success small"></i> Cotizador de Planes
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-chevron-right text-success small"></i> Ubicación y Contacto
                </Link>
              </li>              
            </ul>
          </div>

          {/* Columna 3: Horarios de Atención */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Horarios de Atención
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small text-white-50">
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-clock-history text-warning mt-0.5"></i>
                <div>
                  <strong className="text-white d-block">Visitas al Camposanto:</strong>
                  Lunes a Domingo: 07:00 a 18:00 hrs
                </div>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-building text-warning mt-0.5"></i>
                <div>
                  <strong className="text-white d-block">Oficinas Administrativas:</strong>
                  Lunes a Viernes: 08:00 a 17:00 hrs<br />
                  Sábados: 08:00 a 12:00 hrs
                </div>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto y Emergencias */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Emergencias y Ubicación
            </h6>
            <div className="card bg-white bg-opacity-5 border border-white border-opacity-10 p-3 rounded-3 mb-3">
              <div className="d-flex align-items-center gap-2 text-warning fw-bold small mb-1">
                <i className="bi bi-telephone-inbound-fill"></i>
                <span>Atención Inmediata 24/7:</span>
              </div>
              <div className="text-yellow fs-6 fw-bold">PBX: (502) 7764-0000</div>
              <div className="text-yellow-50 small">WhatsApp: (502) 4500-1122</div>
            </div>
            <div className="text-white-50 small d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt-fill text-danger fs-6"></i>
              <span>Huehuetenango, Guatemala, C.A.</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-3 border-top border-secondary border-opacity-25 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-white-50">
          <div>
            &copy; {currentYear} Camposanto Memorial Los Robles. Todos los derechos reservados.
          </div>
          <div className="d-flex gap-3">
            <span>Sistema Integral de Gestión de Cementerios Privados</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const handleAuthRedirect = () => {
    if (isAuthenticated) {
      if (role === 'Cliente Propietario') {
        navigate('/portal-cliente');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-navy-dark sticky-top border-bottom border-secondary border-opacity-25 py-2.5">
      <div className="container">
        {/* Marca / Logo Institucional */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2.5 text-white text-decoration-none">
          <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-10 rounded-circle" style={{ width: '42px', height: '42px' }}>
            <i className="bi bi-flower1 fs-4 text-warning"></i>
          </div>
          <div>
            <div className="fw-bold fs-6 lh-sm" style={{ letterSpacing: '-0.02em' }}>
              Camposanto Memorial Los Robles
            </div>
            <div className="text-white-50 small lh-1" style={{ fontSize: '0.75rem' }}>
              Huehuetenango, Guatemala
            </div>
          </div>
        </Link>

        {/* Botón Móvil Toggler */}
        <button
          className="navbar-toggler border-0 shadow-none text-white"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-3`}></i>
        </button>

        {/* Enlaces de Navegación */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 py-2 py-lg-0 gap-lg-1">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `public-navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-house-door me-1.5"></i>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/servicios"
                className={({ isActive }) => `public-navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-grid-3x3-gap me-1.5"></i>
                Servicios Memoriales
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/cotizador-publico"
                className={({ isActive }) => `public-navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-calculator me-1.5"></i>
                Cotizador de Planes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/contacto"
                className={({ isActive }) => `public-navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-geo-alt me-1.5"></i>
                Ubicación y Contacto
              </NavLink>
            </li>
          </ul>

          {/* Botón Destacado de Acceso al Sistema */}
          <div className="d-flex align-items-center gap-2 pt-2 pt-lg-0">
            <button
              onClick={handleAuthRedirect}
              className="btn btn-secondary-custom d-flex align-items-center gap-2 px-3.5 py-2 rounded-pill fw-semibold shadow-sm w-100 w-lg-auto justify-content-center"
              title={isAuthenticated ? 'Ir al Panel del Sistema' : 'Iniciar Sesión en el Sistema'}
            >
              <i className={`bi ${isAuthenticated ? 'bi-speedometer2' : 'bi-shield-lock-fill'} fs-6 text-warning`}></i>
              <span>{isAuthenticated ? 'Panel del Sistema' : 'Ingresar al Sistema'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

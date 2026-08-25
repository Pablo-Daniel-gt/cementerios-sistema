import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom px-4 py-2">
      <div className="container-fluid p-0">
        <span className="navbar-brand d-flex align-items-center gap-2.5 fw-bold text-light">
          <i className="bi bi-flower1 fs-4" style={{ color: '#A7F3D0' }}></i>
          <span style={{ fontFamily: 'Plus Jakarta Sans', letterSpacing: '-0.01em' }}>
            Cementerios Privados de Huehuetenango
          </span>
        </span>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-md-block">
            <div className="fw-semibold text-light small">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="badge bg-white bg-opacity-10 text-light text-uppercase border border-white border-opacity-10" style={{ fontSize: '0.7rem' }}>
              {role || 'Usuario'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
            title="Cerrar Sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

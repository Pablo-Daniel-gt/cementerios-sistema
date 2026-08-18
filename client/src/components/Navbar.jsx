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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow-sm border-bottom border-secondary">
      <div className="container-fluid">
        <span className="navbar-brand d-flex align-items-center gap-2 fw-bold text-light">
          <i className="bi bi-bank fs-4 text-info"></i>
          <span>Cementerios Privados Huehuetenango</span>
        </span>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-md-block">
            <div className="fw-semibold text-light small">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="badge bg-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
              {role || 'Usuario'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
            title="Cerrar Sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

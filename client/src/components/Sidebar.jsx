import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { role } = useAuth();

  const isClient = role === 'Cliente Propietario';

  return (
    <aside className="sidebar-container p-3 d-flex flex-column">
      <div className="text-center py-3 border-bottom border-secondary mb-3">
        <h6 className="text-uppercase tracking-wider fw-bold text-light mb-0" style={{ letterSpacing: '1px' }}>
          Sistema Web
        </h6>
        <small className="text-muted">Módulo de Cuentas</small>
      </div>

      <nav className="nav nav-pills flex-column mb-auto">
        {!isClient && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/clientes"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-people-fill"></i>
              <span>Clientes / Titulares</span>
            </NavLink>
          </>
        )}

        {role === 'Administrador' && (
          <>
            <NavLink
              to="/usuarios"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-person-badge-fill"></i>
              <span>Usuarios</span>
            </NavLink>

            <NavLink
              to="/roles"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>Roles</span>
            </NavLink>

            <NavLink
              to="/bitacora"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-journal-text"></i>
              <span>Bitácora Auditoría</span>
            </NavLink>
          </>
        )}

        {isClient && (
          <NavLink
            to="/portal-cliente"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-person-workspace"></i>
            <span>Mi Portal Cliente</span>
          </NavLink>
        )}
      </nav>

      <div className="pt-3 border-top border-secondary text-center small text-muted">
        UMG Huehuetenango &copy; 2026
      </div>
    </aside>
  );
};

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { role } = useAuth();
  const isClient = role === 'Cliente Propietario';

  return (
    <aside className="sidebar-container p-3 d-flex flex-column">
      <div className="text-center py-3 border-bottom border-white border-opacity-10 mb-3">
        <h6 className="text-uppercase tracking-wider fw-bold text-light mb-1" style={{ letterSpacing: '1.5px', fontSize: '0.85rem' }}>
          Sistema Web
        </h6>
        <div className="badge bg-white bg-opacity-10 text-light fw-normal px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
          CAMPOSANTO COMERCIAL
        </div>
      </div>

      <nav className="nav nav-pills flex-column mb-auto">
        {!isClient && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Panel de Control</span>
            </NavLink>

            {/* Módulo B: Inventario de Inmuebles y Camposanto */}
            <div className="px-3 pt-3 pb-1 text-uppercase text-light text-opacity-50 fw-bold small" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
              Camposanto & Inmuebles
            </div>

            <NavLink
              to="/inventario"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
              <span>Mapa de Nichos 2D</span>
            </NavLink>

            <NavLink
              to="/inventario/estructuras"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-building"></i>
              <span>Sectores / Estructuras</span>
            </NavLink>

            {/* Módulo C: Gestión Comercial y Financiera */}
            <div className="px-3 pt-3 pb-1 text-uppercase text-light text-opacity-50 fw-bold small" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
              Gestión Comercial
            </div>

            <NavLink
              to="/comercial/cotizador"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-calculator"></i>
              <span>Cotizador Financiero</span>
            </NavLink>

            <NavLink
              to="/comercial/contratos"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-file-earmark-text"></i>
              <span>Contratos Comerciales</span>
            </NavLink>

            <NavLink
              to="/comercial/caja"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-cash"></i>
              <span>Caja y Recibos</span>
            </NavLink>

            <NavLink
              to="/comercial/alertas-mora"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-exclamation-triangle"></i>
              <span>Alertas de Mora</span>
            </NavLink>

            <NavLink
              to="/clientes"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-people"></i>
              <span>Clientes / Titulares</span>
            </NavLink>
          </>
        )}

        {role === 'Administrador' && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-light text-opacity-50 fw-bold small" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
              Administración
            </div>

            <NavLink
              to="/usuarios"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-person-badge"></i>
              <span>Usuarios</span>
            </NavLink>

            <NavLink
              to="/roles"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-shield-lock"></i>
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

      <div className="pt-3 border-top border-white border-opacity-10 text-center small text-light text-opacity-50">
        UMG Huehuetenango &copy; 2026
      </div>
    </aside>
  );
};

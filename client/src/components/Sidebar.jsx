import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { role } = useAuth();
  const isClient = role === 'Cliente Propietario';

  // Estado de colapso global del Sidebar (Modo Iconos / Compacto)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Estado de secciones colapsables (Accordions por categoría)
  const [openSections, setOpenSections] = useState({
    camposanto: true,
    comercial: true,
    operaciones: true,
    admin: true,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sidebar-container p-3 d-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Encabezado con Logotipo y Botón Toggle de Menú */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-white border-opacity-10 mb-3">
        {!isCollapsed && (
          <div>
            <h6 className="text-uppercase tracking-wider fw-bold text-light mb-0" style={{ letterSpacing: '1.5px', fontSize: '0.85rem' }}>
              Sistema Web
            </h6>
            <div className="badge bg-white bg-opacity-10 text-light fw-normal px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
              CAMPOSANTO
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-sm text-light bg-white bg-opacity-10 mx-auto"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expandir Menú Lateral' : 'Colapsar Menú Lateral'}
        >
          <i className={`bi ${isCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
        </button>
      </div>

      {/* Navegación Principal con Scroll Independiente */}
      <nav className="nav nav-pills flex-column mb-auto">
        {!isClient && (
          <>
            {/* Dashboard / Inicio */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Panel de Control General"
            >
              <i className="bi bi-speedometer2"></i>
              <span className="links_name">Panel General</span>
            </NavLink>

            {/* Módulo B: Inventario de Inmuebles y Camposanto */}
            <div
              className={`section-header ${!openSections.camposanto ? 'collapsed' : ''}`}
              onClick={() => toggleSection('camposanto')}
              title="Camposanto & Inmuebles"
            >
              <span className="links_name">Camposanto & Inmuebles</span>
              <i className={`bi chevron-icon ${openSections.camposanto ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>

            {(openSections.camposanto || isCollapsed) && (
              <div className="section-collapse">
                <NavLink
                  to="/inventario"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Mapa de Nichos 2D"
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                  <span className="links_name">Mapa de Nichos 2D</span>
                </NavLink>

                <NavLink
                  to="/inventario/estructuras"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Sectores / Estructuras"
                >
                  <i className="bi bi-building"></i>
                  <span className="links_name">Sectores / Estructuras</span>
                </NavLink>
              </div>
            )}

            {/* Módulo C: Gestión Comercial y Financiera */}
            <div
              className={`section-header ${!openSections.comercial ? 'collapsed' : ''}`}
              onClick={() => toggleSection('comercial')}
              title="Gestión Comercial"
            >
              <span className="links_name">Gestión Comercial</span>
              <i className={`bi chevron-icon ${openSections.comercial ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>

            {(openSections.comercial || isCollapsed) && (
              <div className="section-collapse">
                <NavLink
                  to="/comercial/cotizador"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Cotizador Financiero"
                >
                  <i className="bi bi-calculator"></i>
                  <span className="links_name">Cotizador Financiero</span>
                </NavLink>

                <NavLink
                  to="/comercial/contratos"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Contratos Comerciales"
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span className="links_name">Contratos Comerciales</span>
                </NavLink>

                <NavLink
                  to="/comercial/caja"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Caja y Recibos"
                >
                  <i className="bi bi-cash"></i>
                  <span className="links_name">Caja y Recibos</span>
                </NavLink>

                <NavLink
                  to="/comercial/alertas-mora"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Alertas de Mora"
                >
                  <i className="bi bi-exclamation-triangle"></i>
                  <span className="links_name">Alertas de Mora</span>
                </NavLink>

                <NavLink
                  to="/clientes"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Clientes / Titulares"
                >
                  <i className="bi bi-people"></i>
                  <span className="links_name">Clientes / Titulares</span>
                </NavLink>
              </div>
            )}

            {/* Módulo D: Operaciones de Inhumación y Sepelios */}
            <div
              className={`section-header ${!openSections.operaciones ? 'collapsed' : ''}`}
              onClick={() => toggleSection('operaciones')}
              title="Operaciones & Sepelios"
            >
              <span className="links_name">Operaciones & Sepelios</span>
              <i className={`bi chevron-icon ${openSections.operaciones ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>

            {(openSections.operaciones || isCollapsed) && (
              <div className="section-collapse">
                <NavLink
                  to="/inhumaciones/difuntos"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Registro de Difuntos"
                >
                  <i className="bi bi-person-lines-fill"></i>
                  <span className="links_name">Registro de Difuntos</span>
                </NavLink>

                <NavLink
                  to="/inhumaciones/registros"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Control de Inhumaciones"
                >
                  <i className="bi bi-flower1"></i>
                  <span className="links_name">Control de Inhumaciones</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* Sección de Administración Exclusiva para Administrador */}
        {role === 'Administrador' && (
          <>
            <div
              className={`section-header ${!openSections.admin ? 'collapsed' : ''}`}
              onClick={() => toggleSection('admin')}
              title="Administración"
            >
              <span className="links_name">Administración</span>
              <i className={`bi chevron-icon ${openSections.admin ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>

            {(openSections.admin || isCollapsed) && (
              <div className="section-collapse">
                <NavLink
                  to="/usuarios"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Usuarios del Sistema"
                >
                  <i className="bi bi-person-badge"></i>
                  <span className="links_name">Usuarios</span>
                </NavLink>

                <NavLink
                  to="/roles"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Gestión de Roles"
                >
                  <i className="bi bi-shield-lock"></i>
                  <span className="links_name">Roles</span>
                </NavLink>

                <NavLink
                  to="/bitacora"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title="Bitácora de Auditoría"
                >
                  <i className="bi bi-journal-text"></i>
                  <span className="links_name">Bitácora Auditoría</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {isClient && (
          <NavLink
            to="/portal-cliente"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title="Mi Portal Cliente"
          >
            <i className="bi bi-person-workspace"></i>
            <span className="links_name">Mi Portal Cliente</span>
          </NavLink>
        )}
      </nav>

      {!isCollapsed && (
        <div className="pt-3 border-top border-white border-opacity-10 text-center small text-light text-opacity-50">
          UMG Huehuetenango &copy; 2026
        </div>
      )}
    </aside>
  );
};

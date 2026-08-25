import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerClientes, obtenerUsuarios, obtenerBitacora, obtenerRoles } from '../api/cuentas.api';
import { getSectores, getEstructuras } from '../api/inventario.api';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    clientes: 0,
    usuarios: 0,
    bitacora: 0,
    roles: 0,
    sectores: 0,
    estructuras: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resClientes, resUsuarios, resBitacora, resRoles, resSectores, resEstructuras] = await Promise.allSettled([
          obtenerClientes(),
          obtenerUsuarios(),
          obtenerBitacora(),
          obtenerRoles(),
          getSectores(),
          getEstructuras(),
        ]);

        setStats({
          clientes: resClientes.status === 'fulfilled' && Array.isArray(resClientes.value.data) ? resClientes.value.data.length : 0,
          usuarios: resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value.data) ? resUsuarios.value.data.length : 0,
          bitacora: resBitacora.status === 'fulfilled' && Array.isArray(resBitacora.value.data) ? resBitacora.value.data.length : 0,
          roles: resRoles.status === 'fulfilled' && Array.isArray(resRoles.value.data) ? resRoles.value.data.length : 0,
          sectores: resSectores.status === 'fulfilled' && Array.isArray(resSectores.value.data) ? resSectores.value.data.length : 0,
          estructuras: resEstructuras.status === 'fulfilled' && Array.isArray(resEstructuras.value.data) ? resEstructuras.value.data.length : 0,
        });
      } catch (err) {
        console.error('Error al obtener estadisticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Panel de Control General</h3>
          <p className="text-muted mb-0">
            Bienvenido(a), <span className="fw-semibold text-primary">{user?.first_name || user?.username}</span> | Rol: <span className="badge bg-dark">{role}</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando indicadores del sistema...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas Informativas */}
          <div className="row g-3 mb-4">
            {/* Tarjeta Inventario 2D */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm bg-white border-start border-primary border-4">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-uppercase text-muted fw-bold small mb-1">Estructuras</h6>
                    <h2 className="fw-bold mb-0 text-primary">{stats.estructuras}</h2>
                    <small className="text-muted">{stats.sectores} Sectores activos</small>
                  </div>
                  <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                    <i className="bi bi-grid-3x3-gap-fill fs-3"></i>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0">
                  <Link to="/inventario" className="small text-primary text-decoration-none fw-semibold">
                    Ver Inventario de Nichos <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm bg-white">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-uppercase text-muted fw-bold small mb-1">Clientes / Titulares</h6>
                    <h2 className="fw-bold mb-0 text-success">{stats.clientes}</h2>
                  </div>
                  <div className="bg-success-subtle text-success p-3 rounded-circle">
                    <i className="bi bi-people-fill fs-3"></i>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0">
                  <Link to="/clientes" className="small text-success text-decoration-none fw-semibold">
                    Ver todos <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            {role === 'Administrador' && (
              <>
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card h-100 border-0 shadow-sm bg-white">
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted fw-bold small mb-1">Usuarios Sistema</h6>
                        <h2 className="fw-bold mb-0 text-info">{stats.usuarios}</h2>
                      </div>
                      <div className="bg-info-subtle text-info p-3 rounded-circle">
                        <i className="bi bi-person-badge-fill fs-3"></i>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent border-0 pt-0">
                      <Link to="/usuarios" className="small text-info text-decoration-none fw-semibold">
                        Administrar usuarios <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card h-100 border-0 shadow-sm bg-white">
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted fw-bold small mb-1">Eventos Bitácora</h6>
                        <h2 className="fw-bold mb-0 text-warning">{stats.bitacora}</h2>
                      </div>
                      <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                        <i className="bi bi-journal-text fs-3"></i>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent border-0 pt-0">
                      <Link to="/bitacora" className="small text-warning text-decoration-none fw-semibold">
                        Auditar registros <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Accesos Rápidos */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-dark">Acciones Rápidas del Sistema</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <Link to="/inventario" className="btn btn-outline-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-grid-3x3-gap-fill fs-4"></i>
                    <span className="fw-semibold">Inventario/Listado</span>
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/clientes/nuevo" className="btn btn-outline-success w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-person-plus-fill fs-4"></i>
                    <span className="fw-semibold">Registrar Nuevo Cliente</span>
                  </Link>
                </div>
                {role === 'Administrador' && (
                  <div className="col-md-4">
                    <Link to="/inventario/estructuras" className="btn btn-outline-info w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                      <i className="bi bi-building-add fs-4"></i>
                      <span className="fw-semibold">Gestionar Sectores y Estructuras</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

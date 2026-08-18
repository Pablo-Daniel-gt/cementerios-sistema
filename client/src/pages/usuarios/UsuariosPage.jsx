import { useEffect, useState } from 'react';
import { obtenerUsuarios, eliminarUsuario } from '../../api/cuentas.api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await obtenerUsuarios();
      if (Array.isArray(res.data)) {
        setUsuarios(res.data);
      } else {
        setUsuarios([]);
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleDelete = async (id, username) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario ${username}?`)) {
      try {
        await eliminarUsuario(id);
        toast.success(`Usuario ${username} eliminado exitosamente.`);
        loadUsuarios();
      } catch (err) {
        console.error('Error al eliminar usuario:', err);
      }
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const term = searchQuery.toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const nombre = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return username.includes(term) || email.includes(term) || nombre.includes(term);
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Gestión de Usuarios del Sistema</h3>
          <p className="text-muted mb-0">Administración de credenciales, roles y accesos</p>
        </div>
        <Link to="/usuarios/nuevo" className="btn btn-success d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-person-plus-fill"></i>
          <span>Nuevo Usuario</span>
        </Link>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por Usuario, Nombre o Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2 text-muted">Cargando lista de usuarios...</p>
            </div>
          ) : Array.isArray(usuariosFiltrados) && usuariosFiltrados.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Usuario (Username)</th>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Rol Asignado</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-bold text-dark">
                        <i className="bi bi-person-circle me-2 text-secondary"></i>
                        {u.username}
                      </td>
                      <td>
                        {u.first_name || u.last_name ? (
                          `${u.first_name || ''} ${u.last_name || ''}`
                        ) : (
                          <span className="text-muted small">Sin Nombre Registrado</span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge bg-primary">
                          {u.rol_nombre || 'Sin Rol'}
                        </span>
                      </td>
                      <td>
                        {u.is_active ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Activo
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/usuarios/editar/${u.id}`}
                            className="btn btn-outline-secondary"
                            title="Editar Usuario"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="btn btn-outline-danger"
                            title="Eliminar Usuario"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              <span>No se encontraron usuarios registrados.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

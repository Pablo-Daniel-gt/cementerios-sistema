import { useEffect, useState } from 'react';
import { obtenerRoles, eliminarRol } from '../../api/cuentas.api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await obtenerRoles();
      if (Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('Error al obtener roles:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el rol ${nombre}?`)) {
      try {
        await eliminarRol(id);
        toast.success(`Rol ${nombre} eliminado exitosamente.`);
        loadRoles();
      } catch (err) {
        console.error('Error al eliminar rol:', err);
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Gestión de Roles y Niveles de Acceso</h3>
          <p className="text-muted mb-0">Definición de roles de usuario del sistema</p>
        </div>
        <Link to="/roles/nuevo" className="btn btn-warning d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-shield-plus"></i>
          <span>Nuevo Rol</span>
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="mt-2 text-muted">Cargando lista de roles...</p>
            </div>
          ) : Array.isArray(roles) && roles.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>                    
                    <th>Nombre de Rol</th>
                    <th>Descripción</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id}>                      
                      <td className="fw-bold text-dark">
                        <i className="bi bi-shield-lock me-2 text-warning"></i>
                        {r.nombre}
                      </td>
                      <td>{r.descripcion || <span className="text-muted italic">Sin descripción</span>}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/roles/editar/${r.id}`}
                            className="btn btn-outline-secondary"
                            title="Editar Rol"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(r.id, r.nombre)}
                            className="btn btn-outline-danger"
                            title="Eliminar Rol"
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
              <span>No se encontraron roles registrados.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

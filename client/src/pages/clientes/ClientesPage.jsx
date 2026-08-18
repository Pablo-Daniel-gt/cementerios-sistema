import { useEffect, useState } from 'react';
import { obtenerClientes, eliminarCliente } from '../../api/cuentas.api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await obtenerClientes();
      if (Array.isArray(res.data)) {
        setClientes(res.data);
      } else {
        setClientes([]);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente ${nombre}?`)) {
      try {
        await eliminarCliente(id);
        toast.success(`Cliente ${nombre} eliminado exitosamente.`);
        loadClientes();
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
      }
    }
  };

  // Filtrar por CUI, Nombres o Apellidos en tiempo real
  const clientesFiltrados = clientes.filter((c) => {
    const term = searchQuery.toLowerCase();
    const nombreCompleto = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase();
    const cui = (c.cui || '').toLowerCase();
    return nombreCompleto.includes(term) || cui.includes(term);
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Gestión de Clientes (Titulares)</h3>
          <p className="text-muted mb-0">Registro y control de compradores y titulares del cementerio</p>
        </div>
        <Link to="/clientes/nuevo" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-person-plus-fill"></i>
          <span>Nuevo Cliente</span>
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
                  placeholder="Buscar por CUI o Nombre..."
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
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Cargando la lista de clientes...</p>
            </div>
          ) : Array.isArray(clientesFiltrados) && clientesFiltrados.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>CUI / DPI</th>
                    <th>Nombre Completo</th>
                    <th>Teléfono</th>
                    <th>Correo Electrónico</th>
                    <th>Dirección</th>
                    <th>Usuario Asociado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="fw-semibold text-primary">{cliente.cui}</td>
                      <td className="fw-bold">{cliente.nombres} {cliente.apellidos}</td>
                      <td>{cliente.telefono || <span className="text-muted italic">N/A</span>}</td>
                      <td>{cliente.correo || <span className="text-muted">N/A</span>}</td>
                      <td>{cliente.direccion || <span className="text-muted">N/A</span>}</td>
                      <td>
                        {cliente.usuario_username ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-person-check me-1"></i>
                            {cliente.usuario_username}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">Sin Usuario</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/clientes/editar/${cliente.id}`}
                            className="btn btn-outline-secondary"
                            title="Editar Cliente"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.id, `${cliente.nombres} ${cliente.apellidos}`)}
                            className="btn btn-outline-danger"
                            title="Eliminar Cliente"
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
              <span>No se encontraron clientes registrados.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDifuntos, eliminarDifunto } from '../../api/inhumaciones.api';
import { DifuntoFormModal } from '../../components/inhumaciones/DifuntoFormModal';

export const DifuntosListPage = () => {
  const navigate = useNavigate();
  const [difuntos, setDifuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [difuntoEditar, setDifuntoEditar] = useState(null);

  useEffect(() => {
    cargarDifuntos();
  }, []);

  const cargarDifuntos = async (searchParam = '') => {
    setLoading(true);
    try {
      const params = {};
      if (searchParam) params.search = searchParam;
      const res = await getDifuntos(params);
      setDifuntos(res.data || []);
    } catch (error) {
      console.error('Error al cargar difuntos:', error);
      toast.error('No se pudo cargar la lista de difuntos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    cargarDifuntos(val);
  };

  const handleNuevoDifunto = () => {
    setDifuntoEditar(null);
    setShowFormModal(true);
  };

  const handleEditarDifunto = (difuntoObj) => {
    setDifuntoEditar(difuntoObj);
    setShowFormModal(true);
  };

  const handleEliminarDifunto = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el registro de ${nombre}?`)) {
      try {
        await eliminarDifunto(id);
        toast.success(`Difunto ${nombre} eliminado correctamente.`);
        cargarDifuntos(search);
      } catch (error) {
        console.error('Error al eliminar difunto:', error);
      }
    }
  };

  const handleRegistrarSepelio = (difuntoObj) => {
    navigate('/inhumaciones/registros', { state: { difunto_preseleccionado: difuntoObj } });
  };

  return (
    <div className="container-fluid py-3">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-person-lines-fill text-primary me-2"></i>
            Catálogo Biográfico de Difuntos
          </h2>
          <small className="text-muted">
            Registro biográfico y control sanitario/legal de personas fallecidas
          </small>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={handleNuevoDifunto}
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Registrar Difunto</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por CUI, Nombres, Apellidos o Causa de Muerte..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Difuntos */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Cargando registros de difuntos...</p>
            </div>
          ) : difuntos.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox display-4 mb-2 d-block"></i>
              No se encontraron registros de difuntos.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>CUI / DPI</th>
                    <th>Nombre Completo</th>
                    <th>Fecha Nacimiento</th>
                    <th>Fecha Defunción</th>
                    <th>Causa Muerte</th>
                    <th>Lugar Defunción</th>
                    <th>Estado Sepelio</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {difuntos.map((d) => (
                    <tr key={d.id}>
                      <td className="fw-semibold text-primary">
                        {d.cui ? d.cui : <span className="badge bg-light text-muted border">Neonato / Sin CUI</span>}
                      </td>
                      <td className="fw-bold">{d.nombres} {d.apellidos}</td>
                      <td>{d.fecha_nacimiento || <span className="text-muted">N/A</span>}</td>
                      <td className="fw-semibold text-danger">{d.fecha_defuncion}</td>
                      <td>{d.causa_muerte}</td>
                      <td>{d.lugar_defuncion || <span className="text-muted">No especificado</span>}</td>
                      <td>
                        {d.tiene_inhumacion ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-check-circle-fill me-1"></i> Inhumado
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            <i className="bi bi-clock-history me-1"></i> Pendiente Inhumación
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {!d.tiene_inhumacion && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              title="Registrar Inhumación / Sepelio"
                              onClick={() => handleRegistrarSepelio(d)}
                            >
                              <i className="bi bi-flower1 me-1"></i> Sepelio
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar Datos"
                            onClick={() => handleEditarDifunto(d)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Eliminar Record"
                            onClick={() => handleEliminarDifunto(d.id, `${d.nombres} ${d.apellidos}`)}
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
          )}
        </div>
      </div>

      {/* Modal Formulario Difunto */}
      {showFormModal && (
        <DifuntoFormModal
          difunto={difuntoEditar}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => cargarDifuntos(search)}
        />
      )}
    </div>
  );
};

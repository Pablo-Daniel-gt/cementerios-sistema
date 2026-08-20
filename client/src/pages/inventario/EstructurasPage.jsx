import React, { useState, useEffect } from 'react';
import {
  getSectores,
  eliminarSector,
  getTiposEstructura,
  eliminarTipoEstructura,
  getEstructuras,
  eliminarEstructura,
  generarLoteEspacios,
  getEstadosEspacio,
} from '../../api/inventario.api';
import { NichoFormModal } from '../../components/inventario/NichoFormModal';
import { SectorModal } from '../../components/inventario/SectorModal';
import { TipoEstructuraModal } from '../../components/inventario/TipoEstructuraModal';
import { EstructuraModal } from '../../components/inventario/EstructuraModal';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function EstructurasPage() {
  const [sectores, setSectores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [estructuras, setEstructuras] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pestaña Activa: 'ESTRUCTURAS' | 'SECTORES' | 'TIPOS'
  const [activeTab, setActiveTab] = useState('ESTRUCTURAS');

  // Modales
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showEstructuraModal, setShowEstructuraModal] = useState(false);
  const [showNichoFormModal, setShowNichoFormModal] = useState(false);

  // Editing targets
  const [sectorEditing, setSectorEditing] = useState(null);
  const [tipoEditing, setTipoEditing] = useState(null);
  const [estructuraEditing, setEstructuraEditing] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resSectores, resTipos, resEstructuras, resEstados] = await Promise.all([
        getSectores(),
        getTiposEstructura(),
        getEstructuras(),
        getEstadosEspacio(),
      ]);
      setSectores(resSectores.data);
      setTipos(resTipos.data);
      setEstructuras(resEstructuras.data);
      setEstados(resEstados.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información de administración de inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- SECTOR CRUD ---
  const handleOpenSectorModal = (sector = null) => {
    setSectorEditing(sector);
    setShowSectorModal(true);
  };

  const handleDeleteSector = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el sector "${nombre}"?`)) {
      try {
        await eliminarSector(id);
        toast.success('Sector eliminado correctamente.');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar sector:', error);
      }
    }
  };

  // --- TIPO DE ESTRUCTURA CRUD ---
  const handleOpenTipoModal = (tipo = null) => {
    setTipoEditing(tipo);
    setShowTipoModal(true);
  };

  const handleDeleteTipo = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar el tipo de estructura "${nombre}"?`)) {
      try {
        await eliminarTipoEstructura(id);
        toast.success('Tipo de estructura eliminado correctamente.');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar tipo de estructura:', error);
      }
    }
  };

  // --- ESTRUCTURA CRUD ---
  const handleOpenEstructuraModal = (estructura = null) => {
    setEstructuraEditing(estructura);
    setShowEstructuraModal(true);
  };

  const handleDeleteEstructura = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar la estructura "${nombre}"?`)) {
      try {
        await eliminarEstructura(id);
        toast.success('Estructura eliminada correctamente.');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar estructura:', error);
      }
    }
  };

  // --- GENERACIÓN EN LOTE DE NICHOS (REQUISITO 1) ---
  const handleGenerarLote = async (idEst, nombre) => {
    if (window.confirm(`¿Desea autogenerar los nichos (espacios físicos) faltantes para la estructura "${nombre}"?`)) {
      try {
        const response = await generarLoteEspacios(idEst);
        toast.success(response.data.mensaje || 'Nichos generados exitosamente.');
        cargarDatos();
      } catch (error) {
        console.error('Error al generar nichos en lote:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 min-vh-50">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="fw-semibold text-secondary">Cargando administración de inventario...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 pb-3 border-bottom">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-gear-wide-connected text-primary"></i>
            Administración de Inventario de Camposanto
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Gestión de Sectores, Tipos de Estructura, Estructuras Físicas y Nichos.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/inventario" className="btn btn-outline-secondary d-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i>
            Inventario de Nichos
          </Link>

          <button
            onClick={() => setShowNichoFormModal(true)}
            className="btn btn-outline-success d-flex align-items-center gap-1"
          >
            <i className="bi bi-box-seam"></i>
            Nuevo Nicho Individual
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <ul className="nav nav-tabs mb-4 border-bottom-0">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'ESTRUCTURAS' ? 'active bg-primary text-white' : 'text-secondary'}`}
            onClick={() => setActiveTab('ESTRUCTURAS')}
          >
            <i className="bi bi-building me-1"></i>
            Estructuras Físicas ({estructuras.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'SECTORES' ? 'active bg-success text-white' : 'text-secondary'}`}
            onClick={() => setActiveTab('SECTORES')}
          >
            <i className="bi bi-geo-alt me-1"></i>
            Sectores ({sectores.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'TIPOS' ? 'active bg-info text-white' : 'text-secondary'}`}
            onClick={() => setActiveTab('TIPOS')}
          >
            <i className="bi bi-tags me-1"></i>
            Tipos de Estructura ({tipos.length})
          </button>
        </li>
      </ul>

      {/* PESTAÑA 1: ESTRUCTURAS FÍSICAS */}
      {activeTab === 'ESTRUCTURAS' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold text-dark">
              <i className="bi bi-building-fill text-primary me-2"></i>
              Catálogo de Estructuras Físicas
            </span>
            <button
              onClick={() => handleOpenEstructuraModal()}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-plus-lg"></i> Nueva Estructura
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Código</th>
                    <th>Nombre Estructura</th>
                    <th>Sector</th>
                    <th>Tipo</th>
                    <th>Tamaño</th>
                    <th>Capacidad Total</th>
                    <th>Precio Completo</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estructuras.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No hay estructuras físicas registradas.
                      </td>
                    </tr>
                  ) : (
                    estructuras.map((est) => (
                      <tr key={est.id_estructura}>
                        <td>
                          <span className="badge bg-primary fs-6">{est.codigo_estructura}</span>
                        </td>
                        <td className="fw-semibold">{est.nombre_estructura}</td>
                        <td>{est.sector_nombre || est.sector}</td>
                        <td>
                          <span className="badge bg-info text-white">{est.tipo_estructura_nombre || est.tipo_estructura}</span>
                        </td>
                        <td className="fw-bold text-secondary">
                          {est.total_filas} Filas, {est.total_columnas} Columnas
                        </td>
                        <td>
                          <span className="badge bg-success rounded-pill px-3 py-1">
                            {est.capacidad_total_espacios} espacios
                          </span>
                        </td>
                        <td>
                          {est.precio_estructura_completa
                            ? `Q${Number(est.precio_estructura_completa).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                            : 'Venta Individual'}
                        </td>
                        <td className="text-end">
                          {/* Botón de Generar Nichos en Lote (REQUISITO 1) */}
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            title="Autogenerar todos los nichos en lote para esta estructura"
                            onClick={() => handleGenerarLote(est.id_estructura, est.nombre_estructura)}
                          >
                            <i className="bi bi-magic me-1"></i> Generar Nichos
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenEstructuraModal(est)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteEstructura(est.id_estructura, est.nombre_estructura)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SECTORES */}
      {activeTab === 'SECTORES' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold text-dark">
              <i className="bi bi-geo-alt-fill text-success me-2"></i>
              Catálogo de Sectores (Zonas)
            </span>
            <button
              onClick={() => handleOpenSectorModal()}
              className="btn btn-success btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-plus-circle-fill"></i> Nuevo Sector
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nomenclatura</th>
                    <th>Nombre del Sector</th>
                    <th>Descripción</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sectores.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No hay sectores registrados.
                      </td>
                    </tr>
                  ) : (
                    sectores.map((sec) => (
                      <tr key={sec.id_sector}>
                        <td className="fw-bold">{sec.id_sector}</td>
                        <td>
                          <span className="badge bg-secondary px-2 py-1 fs-6">{sec.nomenclatura}</span>
                        </td>
                        <td className="fw-semibold">{sec.nombre_sector}</td>
                        <td className="text-muted small">{sec.descripcion || 'Sin descripción'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenSectorModal(sec)}
                          >
                            <i className="bi bi-pencil-fill"></i> Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteSector(sec.id_sector, sec.nombre_sector)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: TIPOS DE ESTRUCTURA (REQUISITO 3) */}
      {activeTab === 'TIPOS' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold text-dark">
              <i className="bi bi-tags-fill text-info me-2"></i>
              Catálogo de Tipos de Estructura (CRUD Completo)
            </span>
            <button
              onClick={() => handleOpenTipoModal()}
              className="btn btn-info text-white btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-plus-lg"></i> Nuevo Tipo de Estructura
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Tipo</th>
                    <th>Descripción</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No hay tipos de estructura registrados.
                      </td>
                    </tr>
                  ) : (
                    tipos.map((t) => (
                      <tr key={t.id_tipo_estructura}>
                        <td className="fw-bold">{t.id_tipo_estructura}</td>
                        <td>
                          <span className="badge bg-info text-white fs-6 px-3 py-1">{t.nombre_tipo}</span>
                        </td>
                        <td className="text-muted small">{t.descripcion || 'Sin descripción'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenTipoModal(t)}
                          >
                            <i className="bi bi-pencil-fill"></i> Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTipo(t.id_tipo_estructura, t.nombre_tipo)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECTOR */}
      {showSectorModal && (
        <SectorModal
          sector={sectorEditing}
          onClose={() => setShowSectorModal(false)}
          onSuccess={cargarDatos}
        />
      )}

      {/* MODAL TIPO DE ESTRUCTURA */}
      {showTipoModal && (
        <TipoEstructuraModal
          tipo={tipoEditing}
          onClose={() => setShowTipoModal(false)}
          onSuccess={cargarDatos}
        />
      )}

      {/* MODAL ESTRUCTURA FÍSICA */}
      {showEstructuraModal && (
        <EstructuraModal
          estructura={estructuraEditing}
          sectores={sectores}
          tipos={tipos}
          onClose={() => setShowEstructuraModal(false)}
          onSuccess={cargarDatos}
        />
      )}

      {/* MODAL CREAR / EDITAR NICHO INDIVIDUAL (REQUISITO 1) */}
      {showNichoFormModal && (
        <NichoFormModal
          estructuras={estructuras}
          estados={estados}
          onClose={() => setShowNichoFormModal(false)}
          onSuccess={() => {
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}

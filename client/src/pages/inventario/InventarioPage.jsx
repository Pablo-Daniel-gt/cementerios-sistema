import React, { useState, useEffect, useCallback } from 'react';
import { getSectores, getEstructuras, getMatrizEstructura, getEstadosEspacio, generarLoteEspacios } from '../../api/inventario.api';
import { LeyendaEstados } from '../../components/inventario/LeyendaEstados';
import { MatrizVisual } from '../../components/inventario/MatrizVisual';
import { NichoModal } from '../../components/inventario/NichoModal';
import { NichoFormModal } from '../../components/inventario/NichoFormModal';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function InventarioPage() {
  const [sectores, setSectores] = useState([]);
  const [estructuras, setEstructuras] = useState([]);
  const [estados, setEstados] = useState([]);

  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedEstructuraId, setSelectedEstructuraId] = useState('');

  const [matrizData, setMatrizData] = useState(null);
  const [selectedNicho, setSelectedNicho] = useState(null);
  const [showNichoFormModal, setShowNichoFormModal] = useState(false);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMatriz, setLoadingMatriz] = useState(false);

  // Cargar catalogos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      setLoadingInitial(true);
      try {
        const [resSectores, resEstructuras, resEstados] = await Promise.all([
          getSectores(),
          getEstructuras(),
          getEstadosEspacio(),
        ]);

        setSectores(resSectores.data);
        setEstructuras(resEstructuras.data);
        setEstados(resEstados.data);

        // Seleccionar automáticamente el primer sector y estructura si existen
        if (resEstructuras.data.length > 0) {
          const primeraEst = resEstructuras.data[0];
          setSelectedSectorId(primeraEst.sector);
          setSelectedEstructuraId(primeraEst.id_estructura);
        } else if (resSectores.data.length > 0) {
          setSelectedSectorId(resSectores.data[0].id_sector);
        }
      } catch (error) {
        console.error('Error al cargar datos de inventario:', error);
        toast.error('Error al cargar catálogo de inventario.');
      } finally {
        setLoadingInitial(false);
      }
    };

    cargarCatalogos();
  }, []);

  // Cargar Matriz 2D de la estructura seleccionada
  const cargarMatriz = useCallback(async (idEst) => {
    if (!idEst) {
      setMatrizData(null);
      return;
    }
    setLoadingMatriz(true);
    try {
      const response = await getMatrizEstructura(idEst);
      setMatrizData(response.data);
    } catch (error) {
      console.error('Error al cargar matriz 2D:', error);
      toast.error('No se pudo cargar la matriz 2D de la estructura.');
      setMatrizData(null);
    } finally {
      setLoadingMatriz(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEstructuraId) {
      cargarMatriz(selectedEstructuraId);
    }
  }, [selectedEstructuraId, cargarMatriz]);

  // Generar Nichos en Lote para la estructura seleccionada
  const handleGenerarLoteActual = async () => {
    if (!selectedEstructuraId) return;
    const estActual = estructuras.find((e) => Number(e.id_estructura) === Number(selectedEstructuraId));
    const nombreEst = estActual ? estActual.nombre_estructura : 'la estructura';

    if (window.confirm(`¿Desea generar todos los nichos faltantes para "${nombreEst}"?`)) {
      const toastId = toast.loading('Generando nichos en lote... Esto puede tomar unos instantes según la conexión.');
      try {
        const res = await generarLoteEspacios(selectedEstructuraId);
        toast.success(res.data.mensaje || 'Nichos generados correctamente.', { id: toastId });
        cargarMatriz(selectedEstructuraId);
      } catch (error) {
        console.error('Error al generar nichos:', error);
        toast.dismiss(toastId);
        toast.error('La operación está tomando más tiempo del habitual. Por favor verifique el mapa o intente nuevamente.');
        cargarMatriz(selectedEstructuraId);
      }
    }
  };

  // Filtrar estructuras por sector seleccionado
  const estructurasFiltradas = selectedSectorId
    ? estructuras.filter((est) => Number(est.sector) === Number(selectedSectorId))
    : estructuras;

  // Manejar cambio de sector
  const handleSectorChange = (e) => {
    const sectorId = e.target.value;
    setSelectedSectorId(sectorId);

    const nuevasEsts = sectorId
      ? estructuras.filter((est) => Number(est.sector) === Number(sectorId))
      : estructuras;

    if (nuevasEsts.length > 0) {
      setSelectedEstructuraId(nuevasEsts[0].id_estructura);
    } else {
      setSelectedEstructuraId('');
      setMatrizData(null);
    }
  };

  // Calcular contadores de estado para la Leyenda
  const contadoresEstado = React.useMemo(() => {
    if (!matrizData || !matrizData.matriz_espacios) return {};
    return matrizData.matriz_espacios.reduce((acc, esp) => {
      acc[esp.estado] = (acc[esp.estado] || 0) + 1;
      return acc;
    }, {});
  }, [matrizData]);

  if (loadingInitial) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 min-vh-50">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="fw-semibold text-secondary">Cargando Módulo de Inventario de Camposanto...</span>
      </div>
    );
  }

  const estSeleccionadaObj = estructuras.find((e) => Number(e.id_estructura) === Number(selectedEstructuraId));
  const capacidadTotal = matrizData ? (matrizData.total_filas * matrizData.total_columnas) : (estSeleccionadaObj ? estSeleccionadaObj.capacidad_total_espacios : 0);
  const totalNichosCreados = matrizData && matrizData.matriz_espacios ? matrizData.matriz_espacios.length : (estSeleccionadaObj ? (estSeleccionadaObj.total_espacios_creados || 0) : 0);
  const isEstructuraLlena = capacidadTotal > 0 && totalNichosCreados >= capacidadTotal;

  return (
    <div className="container-fluid p-4">
      {/* Encabezado Principal de la Página */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 pb-3">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            Inventario de Inmuebles y Espacios
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Visualización y control interactivo de disponibilidad en tiempo real.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={handleGenerarLoteActual}
            className="btn btn-outline-success d-flex align-items-center gap-1"
            disabled={!selectedEstructuraId || isEstructuraLlena}
            title={isEstructuraLlena ? "La estructura ya ha alcanzado el 100% de su capacidad de nichos" : ""}
          >
            <i className="bi bi-magic"></i>
            Generar Nichos en Lote
          </button>
          <button
            onClick={() => setShowNichoFormModal(true)}
            className="btn btn-success d-flex align-items-center gap-1"
            disabled={!selectedEstructuraId || isEstructuraLlena}
            title={isEstructuraLlena ? "La estructura ya ha alcanzado el 100% de su capacidad de nichos" : ""}
          >
            <i className="bi bi-plus-circle-fill"></i>
            Nuevo Nicho Individual
          </button>
          <Link to="/inventario/estructuras" className="btn btn-outline-primary d-flex align-items-center gap-1">
            <i className="bi bi-gear-wide-connected"></i>
            Administración Completa
          </Link>
        </div>
      </div>

      {/* Selectores de Filtro de Sector y Estructura */}
      <div className="card shadow-sm border-0 bg-white mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <label className="form-label fw-bold text-secondary small mb-1">
                <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                1. Seleccionar Sector (Zona)
              </label>
              <select
                className="form-select form-select-lg"
                value={selectedSectorId}
                onChange={handleSectorChange}
              >
                <option value="">Todos los Sectores</option>
                {sectores.map((sec) => (
                  <option key={sec.id_sector} value={sec.id_sector}>
                    {sec.nombre_sector} ({sec.nomenclatura})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label fw-bold text-secondary small mb-1">
                <i className="bi bi-building me-1 text-primary"></i>
                2. Seleccionar Estructura Física
              </label>
              <select
                className="form-select form-select-lg"
                value={selectedEstructuraId}
                onChange={(e) => setSelectedEstructuraId(e.target.value)}
                disabled={estructurasFiltradas.length === 0}
              >
                {estructurasFiltradas.length === 0 ? (
                  <option value="" disabled>No hay estructuras asociadas</option>
                ) : (
                  estructurasFiltradas.map((est) => (
                    <option key={est.id_estructura} value={est.id_estructura}>
                      {est.nombre_estructura} ({est.codigo_estructura}) - {est.capacidad_total_espacios} Nichos
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="col-12 col-md-2 text-md-end">
              <button
                className="btn btn-outline-secondary w-100 mt-md-4 d-flex align-items-center justify-content-center gap-1"
                onClick={() => selectedEstructuraId && cargarMatriz(selectedEstructuraId)}
                disabled={loadingMatriz || !selectedEstructuraId}
              >
                <i className={`bi bi-arrow-clockwise ${loadingMatriz ? 'spin' : ''}`}></i>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de Estados e Indicadores */}
      <LeyendaEstados contadores={contadoresEstado} />

      {/* Matriz Visual 2D o Estado de Carga */}
      {loadingMatriz ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white mb-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
          <h6 className="text-secondary">Cargando cuadrícula 2D en tiempo real...</h6>
        </div>
      ) : (
        <MatrizVisual
          estructura={matrizData}
          espacios={matrizData?.matriz_espacios || []}
          onSelectNicho={(espacio) => setSelectedNicho(espacio)}
        />
      )}

      {/* Modal Interactivo de Detalle / Cambio de Estado de Nicho */}
      {selectedNicho && (
        <NichoModal
          espacio={selectedNicho}
          estados={estados}
          onClose={() => setSelectedNicho(null)}
          onUpdate={() => cargarMatriz(selectedEstructuraId)}
        />
      )}

      {/* Modal para Crear Nicho Individual */}
      {showNichoFormModal && (
        <NichoFormModal
          estructuras={estructuras}
          estados={estados}
          defaultEstructuraId={selectedEstructuraId}
          onClose={() => setShowNichoFormModal(false)}
          onSuccess={() => {
            if (selectedEstructuraId) cargarMatriz(selectedEstructuraId);
          }}
        />
      )}
    </div>
  );
}

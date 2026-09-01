import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createContrato, getModalidadesVenta, getEstadosContrato } from '../../api/comercial.api';
import { obtenerClientes } from '../../api/cuentas.api';
import { getEspacios, getEstructuras } from '../../api/inventario.api';

/**
 * Formulario de Creación de Nuevos Contratos Comerciales
 */
export const ContratoFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Precarga opcional desde Cotizador o NichoModal (location.state)
  const statePrev = location.state || {};

  const [clientes, setClientes] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [estadosContrato, setEstadosContrato] = useState([]);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState([]);
  const [estructurasDisponibles, setEstructurasDisponibles] = useState([]);

  const [tipoVentaInmueble, setTipoVentaInmueble] = useState('INDIVIDUAL'); // INDIVIDUAL o ESTRUCTURA
  const [espaciosSeleccionados, setEspaciosSeleccionados] = useState([]);
  const [estructuraSeleccionada, setEstructuraSeleccionada] = useState('');

  const [pagoEngancheInmediato, setPagoEngancheInmediato] = useState(true);
  const [metodoPagoEnganche, setMetodoPagoEnganche] = useState('EFECTIVO');
  const [boletaEnganche, setBoletaEnganche] = useState('');

  const [formData, setFormData] = useState({
    numero_contrato: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    cliente: '',
    modalidad: '',
    estado_contrato: '',
    monto_total: statePrev.monto_total || '24000',
    monto_enganche: statePrev.monto_enganche || '4000',
    plazo_meses: statePrev.plazo_meses || '24',
    fecha_firma: new Date().toISOString().split('T')[0],
    fecha_inicio_pago: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Actualizar estado del contrato automáticamente según si se cancela o no el enganche inicial
  useEffect(() => {
    if (estadosContrato.length > 0) {
      const estadoActivo = estadosContrato.find((e) => (e.nombre_estado_contrato || '').toLowerCase() === 'activo');
      const estadoSolicitado = estadosContrato.find((e) => (e.nombre_estado_contrato || '').toLowerCase() === 'solicitado');
      const numEnganche = parseFloat(formData.monto_enganche || 0);

      if (numEnganche > 0 && pagoEngancheInmediato && estadoActivo) {
        setFormData((prev) => ({ ...prev, estado_contrato: estadoActivo.id_estado_contrato }));
      } else if (estadoSolicitado) {
        setFormData((prev) => ({ ...prev, estado_contrato: estadoSolicitado.id_estado_contrato }));
      }
    }
  }, [pagoEngancheInmediato, formData.monto_enganche, estadosContrato]);

  const cargarCatalogos = async () => {
    try {
      const [resCli, resMod, resEst, resEsp, resEstruc] = await Promise.all([
        obtenerClientes(),
        getModalidadesVenta(),
        getEstadosContrato(),
        getEspacios({ solo_disponibles: 'true' }),
        getEstructuras()
      ]);

      setClientes(resCli.data || []);
      setModalidades(resMod.data || []);
      // Regla a: Al hacer/crear un contrato, la opción de dejarlo como "Cancelado" no debe aparecer
      const estadosValidos = (resEst.data || []).filter(
        (e) => (e.nombre_estado_contrato || '').toLowerCase() !== 'cancelado'
      );
      setEstadosContrato(estadosValidos);

      const todosEspacios = resEsp.data || [];
      // 1. Filtrar solo nichos estrictamente disponibles y no asociados a contratos
      const libres = todosEspacios.filter((e) => {
        const estadoNombre = e.estado_nombre || e.estado?.nombre_estado || '';
        return estadoNombre === 'Disponible' && !e.en_contrato && !e.detalle_contrato;
      });
      setEspaciosDisponibles(libres);

      // 2. Filtrar solo estructuras 100% disponibles (sin ningún nicho apartado o vendido)
      const todasEstructuras = resEstruc.data || [];
      const libresEstructuras = todasEstructuras.filter((est) => {
        if (est.disponible_completa !== undefined) return est.disponible_completa;
        const nichosEstructura = todosEspacios.filter((e) => String(e.estructura) === String(est.id_estructura));
        return (
          nichosEstructura.length > 0 &&
          nichosEstructura.every((e) => (e.estado_nombre || e.estado?.nombre_estado) === 'Disponible' && !e.en_contrato)
        );
      });
      setEstructurasDisponibles(libresEstructuras);

      if (resMod.data && resMod.data.length > 0) {
        const modInicialObj = resMod.data[0];
        const plazoCalculado = statePrev.plazo_meses || obtenerPlazoDeModalidad(modInicialObj);
        setFormData((prev) => ({
          ...prev,
          modalidad: modInicialObj.id_modalidad,
          plazo_meses: plazoCalculado
        }));
      }

      // Regla b: El modo "Solicitado" está seleccionado por defecto si el enganche no ha sido pagado aún
      const estadoSolicitadoObj = estadosValidos.find(
        (e) => (e.nombre_estado_contrato || '').toLowerCase() === 'solicitado'
      );
      const estadoInicialId = estadoSolicitadoObj
        ? estadoSolicitadoObj.id_estado_contrato
        : (estadosValidos[0]?.id_estado_contrato || '');

      if (estadoInicialId) {
        setFormData((prev) => ({ ...prev, estado_contrato: estadoInicialId }));
      }

      if (statePrev.espacioId) {
        const espId = statePrev.espacioId;
        setEspaciosSeleccionados([espId]);
        const espEncontrado = libres.find((e) => String(e.id_espacio) === String(espId));
        if (espEncontrado && espEncontrado.precio_individual) {
          setFormData((prev) => ({ ...prev, monto_total: String(espEncontrado.precio_individual) }));
        }
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast.error('Error al cargar catálogos para el contrato');
    }
  };

  const obtenerPlazoDeModalidad = (modObj) => {
    if (!modObj) return '0';
    if (!modObj.aplica_credito) return '0';
    const match = modObj.nombre_modalidad ? modObj.nombre_modalidad.match(/\d+/) : null;
    return match ? match[0] : '12';
  };

  const handleModalidadChange = (e) => {
    const modId = e.target.value;
    const modObj = modalidades.find((m) => String(m.id_modalidad) === String(modId));
    const nuevoPlazo = obtenerPlazoDeModalidad(modObj);
    setFormData((prev) => ({
      ...prev,
      modalidad: modId,
      plazo_meses: nuevoPlazo
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEspacioToggle = (id) => {
    let nuevosSeleccionados = [];
    if (espaciosSeleccionados.includes(id)) {
      nuevosSeleccionados = espaciosSeleccionados.filter((item) => item !== id);
    } else {
      nuevosSeleccionados = [...espaciosSeleccionados, id];
    }
    setEspaciosSeleccionados(nuevosSeleccionados);

    const sumaPrecios = nuevosSeleccionados.reduce((sum, espId) => {
      const esp = espaciosDisponibles.find((e) => String(e.id_espacio) === String(espId));
      return sum + (esp && esp.precio_individual ? parseFloat(esp.precio_individual) : 0);
    }, 0);

    if (sumaPrecios > 0) {
      setFormData((prev) => ({ ...prev, monto_total: String(sumaPrecios) }));
    }
  };

  const handleEstructuraSelect = (e) => {
    const estId = e.target.value;
    setEstructuraSeleccionada(estId);

    if (!estId) return;

    const estEncontrada = estructurasDisponibles.find((e) => String(e.id_estructura) === String(estId));
    if (estEncontrada) {
      if (estEncontrada.precio_estructura_completa && parseFloat(estEncontrada.precio_estructura_completa) > 0) {
        setFormData((prev) => ({ ...prev, monto_total: String(estEncontrada.precio_estructura_completa) }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente) {
      toast.error('Debe seleccionar un cliente titular');
      return;
    }

    if (tipoVentaInmueble === 'INDIVIDUAL' && espaciosSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos 1 nicho/espacio disponible');
      return;
    }

    if (tipoVentaInmueble === 'ESTRUCTURA' && !estructuraSeleccionada) {
      toast.error('Debe seleccionar una estructura física disponible (Mausoleo/Capilla)');
      return;
    }

    setLoading(true);
    try {
      const numEnganche = parseFloat(formData.monto_enganche || 0);
      const payload = {
        numero_contrato: formData.numero_contrato,
        cliente: parseInt(formData.cliente, 10),
        modalidad: parseInt(formData.modalidad, 10),
        estado_contrato: parseInt(formData.estado_contrato, 10),
        monto_total: parseFloat(formData.monto_total),
        monto_enganche: numEnganche,
        plazo_meses: parseInt(formData.plazo_meses, 10),
        fecha_firma: formData.fecha_firma,
        fecha_inicio_pago: formData.fecha_inicio_pago,
        espacios_ids: tipoVentaInmueble === 'INDIVIDUAL' ? espaciosSeleccionados : [],
        estructura_id: tipoVentaInmueble === 'ESTRUCTURA' ? parseInt(estructuraSeleccionada, 10) : null,
        pago_enganche_inmediato: numEnganche > 0 ? pagoEngancheInmediato : false,
        metodo_pago_enganche: metodoPagoEnganche,
        boleta_enganche: boletaEnganche || null
      };

      await createContrato(payload);
      toast.success('¡Contrato formalizado exitosamente! Los inmuebles fueron apartados.');
      navigate('/comercial/contratos');
    } catch (error) {
      console.error('Error al formalizar contrato:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h2 className="h4 mb-0 fw-bold text-dark">
            <i className="bi bi-file-earmark-plus-fill text-success me-2"></i>
            Formalizar Nuevo Contrato Comercial
          </h2>
          <small className="text-muted">
            Acuerdo formal de compraventa de derechos a perpetuidad y plan de amortización
          </small>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/comercial/contratos')}>
          <i className="bi bi-arrow-left me-1"></i> Regresar al Listado
        </button>
      </div>

      <form onSubmit={handleSubmit} className="row g-4">
        {/* Sección 1: Datos del Contrato */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-dark text-white fw-bold">
              <i className="bi bi-card-heading me-2"></i> 1. Encabezado del Acuerdo Comercial
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Número de Contrato (Único):</label>
                <input
                  type="text"
                  name="numero_contrato"
                  className="form-control fw-bold text-primary"
                  value={formData.numero_contrato}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Cliente / Titular:</label>
                <select
                  name="cliente"
                  className="form-select"
                  value={formData.cliente}
                  onChange={handleChange}
                  required
                >
                  <option value=""disabled hidden>Seleccionar Cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos} (DPI: {c.cui})
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Modalidad de Venta:</label>
                  <select
                    name="modalidad"
                    className="form-select"
                    value={formData.modalidad}
                    onChange={handleModalidadChange}
                    required
                  >
                    {modalidades.map((m) => (
                      <option key={m.id_modalidad} value={m.id_modalidad}>
                        {m.nombre_modalidad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Estado Inicial <small className="text-muted fw-normal">(Autocompletado)</small>:
                  </label>
                  <select
                    name="estado_contrato"
                    className="form-select bg-light text-dark fw-bold"
                    value={formData.estado_contrato}
                    onChange={handleChange}
                    disabled={true}
                    style={{ pointerEvents: 'none', opacity: 0.9 }}
                  >
                    {estadosContrato.map((e) => (
                      <option key={e.id_estado_contrato} value={e.id_estado_contrato}>
                        {e.nombre_estado_contrato}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Monto Total Venta (Q):</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_total"
                    className="form-control fw-bold text-success fs-5"
                    value={formData.monto_total}
                    onChange={handleChange}
                    required
                  />
                  <small className="text-muted">Calculado al seleccionar inmuebles (ajustable).</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Monto de Enganche (Q):</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_enganche"
                    className="form-control fw-bold text-info fs-5 bg-light"
                    value={formData.monto_enganche}
                    readOnly={true}
                    disabled={true}
                    style={{ pointerEvents: 'none', opacity: 0.9 }}
                  />
                  <small className="text-muted">Seleccione una opción de enganche.</small>
                </div>
              </div>

              {/* Bloque de Enganche Ajustado a Grilla Bootstrap 100% Contenida (Reglas 2a, 2b y 2c) */}
              <div className="p-3 mb-3 bg-light border border-info rounded overflow-hidden">
                <label className="form-label fw-bold text-dark d-block mb-2">
                  <i className="bi bi-tag-fill text-info me-1"></i>
                  Opciones de Enganche Inicial:
                </label>
                <div className="row row-cols-2 row-cols-sm-4 g-2 mb-2 w-100 m-0">
                  {[0, 500, 1000, 5000].map((val) => (
                    <div className="col p-1" key={val}>
                      <button
                        type="button"
                        className={`btn btn-sm w-100 ${String(formData.monto_enganche) === String(val) ? 'btn-info text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => setFormData((prev) => ({ ...prev, monto_enganche: String(val) }))}
                      >
                        Q{val.toLocaleString('es-GT')}
                      </button>
                    </div>
                  ))}
                </div>

                {parseFloat(formData.monto_enganche || 0) > 0 && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkPagoEnganche"
                        checked={pagoEngancheInmediato}
                        onChange={(e) => setPagoEngancheInmediato(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold text-dark" htmlFor="checkPagoEnganche">
                        <i className="bi bi-cash-stack text-success me-1"></i>
                        Registrar cobro de Enganche Inicial en la firma.
                      </label>
                    </div>
                    {!pagoEngancheInmediato && (
                      <small className="text-warning d-block font-monospace">
                        <i className="bi bi-clock-history me-1"></i>
                        El enganche quedará pendiente de cobro en caja y el estado será 'Solicitado'.
                      </small>
                    )}

                    {pagoEngancheInmediato && (
                      <div className="row g-2 mt-2">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold mb-1">Método de Pago Enganche:</label>
                          <select
                            className="form-select form-select-sm"
                            value={metodoPagoEnganche}
                            onChange={(e) => setMetodoPagoEnganche(e.target.value)}
                          >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="DEPOSITO_BANCO">Depósito Bancario</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="TARJETA">Tarjeta Débito/Crédito</option>
                          </select>
                        </div>
                        {metodoPagoEnganche !== 'EFECTIVO' && (
                          <div className="col-md-6">
                            <label className="form-label small fw-bold mb-1">No. Boleta / Referencia:</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Ej. Ref #123456"
                              value={boletaEnganche}
                              onChange={(e) => setBoletaEnganche(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Plazo (Meses):</label>
                  <input
                    type="number"
                    name="plazo_meses"
                    className="form-control bg-light"
                    value={formData.plazo_meses}
                    onChange={handleChange}
                    disabled
                    required
                  />
                  <small className="text-muted">Asignado por modalidad.</small>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Fecha de Firma:</label>
                  <input
                    type="date"
                    name="fecha_firma"
                    className="form-control"
                    value={formData.fecha_firma}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Inicio Primer Pago:</label>
                  <input
                    type="date"
                    name="fecha_inicio_pago"
                    className="form-control"
                    value={formData.fecha_inicio_pago}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Asignación de Inmuebles */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <span><i className="bi bi-grid-3x3-gap-fill me-2"></i> 2. Asignación de Inmuebles (Solo Disponibles)</span>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${tipoVentaInmueble === 'INDIVIDUAL' ? 'btn-light fw-bold' : 'btn-outline-light'}`}
                  onClick={() => setTipoVentaInmueble('INDIVIDUAL')}
                >
                  Nichos Individuales
                </button>
                <button
                  type="button"
                  className={`btn ${tipoVentaInmueble === 'ESTRUCTURA' ? 'btn-light fw-bold' : 'btn-outline-light'}`}
                  onClick={() => setTipoVentaInmueble('ESTRUCTURA')}
                >
                  Estructura Completa
                </button>
              </div>
            </div>

            <div className="card-body">
              {tipoVentaInmueble === 'INDIVIDUAL' ? (
                <div>
                  <p className="text-muted small mb-3">
                    Seleccione los nichos disponibles para asociar al contrato (los ya apartados o vendidos están filtrados):
                  </p>
                  <div className="border rounded p-3 bg-light style-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {espaciosDisponibles.length === 0 ? (
                      <div className="text-muted text-center py-3">No hay nichos disponibles actualmente.</div>
                    ) : (
                      <div className="row g-2">
                        {espaciosDisponibles.map((esp) => {
                          const isSelected = espaciosSeleccionados.includes(esp.id_espacio);
                          const precioLabel = esp.precio_individual ? `Q${Number(esp.precio_individual).toLocaleString('es-GT')}` : 'Sin Precio';
                          return (
                            <div className="col-md-6" key={esp.id_espacio}>
                              <div
                                className={`p-2 border rounded cursor-pointer d-flex justify-content-between align-items-center ${
                                  isSelected ? 'bg-primary text-white border-primary' : 'bg-white'
                                }`}
                                onClick={() => handleEspacioToggle(esp.id_espacio)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div>
                                  <span className="small fw-bold d-block">{esp.codigo_unico_espacio}</span>
                                  <small className={isSelected ? 'text-white-50' : 'text-success'}>{precioLabel}</small>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="form-check-input ms-2"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-end text-muted small">
                    Seleccionados: <strong>{espaciosSeleccionados.length} Nichos</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-muted small mb-3">
                    Venta global de Capillas o Mausoleos familiares (solo estructuras con 100% de nichos disponibles):
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Seleccionar Estructura Física Disponible:</label>
                    <select
                      className="form-select"
                      value={estructuraSeleccionada}
                      onChange={handleEstructuraSelect}
                    >
                      <option value="">-- Seleccionar Estructura --</option>
                      {estructurasDisponibles.map((est) => {
                        const precioLabel = est.precio_estructura_completa ? `Q${Number(est.precio_estructura_completa).toLocaleString('es-GT')}` : 'Consultar Precio';
                        return (
                          <option key={est.id_estructura} value={est.id_estructura}>
                            {est.nombre_estructura} ({est.codigo_estructura}) - Capacidad: {est.capacidad_total_espacios} Nichos - {precioLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/comercial/contratos')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success px-4 fw-bold" disabled={loading}>
                  {loading ? 'Formalizando...' : 'Formalizar Contrato'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { crearRegistroInhumacion, getDifuntos } from '../../api/inhumaciones.api';
import { getContratos, getEstadoCuenta } from '../../api/comercial.api';
import { getEspacios } from '../../api/inventario.api';

export const InhumacionFormModal = ({ difuntoPreseleccionado, onClose, onSuccess }) => {
  const [difuntos, setDifuntos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState([]);

  const [selectedDifuntoId, setSelectedDifuntoId] = useState(difuntoPreseleccionado?.id || '');
  const [selectedContratoId, setSelectedContratoId] = useState('');
  const [selectedEspacioId, setSelectedEspacioId] = useState('');
  const [fechaSepelio, setFechaSepelio] = useState(new Date().toISOString().slice(0, 16));
  const [observaciones, setObservaciones] = useState('');

  const [actaRenapFile, setActaRenapFile] = useState(null);
  const [certificadoMspasFile, setCertificadoMspasFile] = useState(null);

  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [contratoDetalle, setContratoDetalle] = useState(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resDif, resCnt, resEsp] = await Promise.all([
        getDifuntos(),
        getContratos(),
        getEspacios(),
      ]);

      // Filtrar sólo difuntos que NO tengan inhumación registrada o el preseleccionado
      const difuntosLibres = (resDif.data || []).filter(
        (d) => !d.tiene_inhumacion || Number(d.id) === Number(difuntoPreseleccionado?.id)
      );
      setDifuntos(difuntosLibres);

      // Filtrar sólo contratos en estado Activo o Liquidado
      const contratosValidos = (resCnt.data || []).filter((c) => {
        const est = (c.estado_nombre || '').toLowerCase();
        return est === 'activo' || est === 'liquidado';
      });
      setContratos(contratosValidos);

      setEspaciosDisponibles(resEsp.data || []);
    } catch (error) {
      console.error('Error al cargar catálogos para sepelio:', error);
      toast.error('Error al obtener catálogos para el registro de inhumación.');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Al seleccionar un contrato, obtener su detalle para filtrar sus nichos correspondientes y verificar solvencia
  const handleContratoChange = async (e) => {
    const contratoId = e.target.value;
    setSelectedContratoId(contratoId);
    setSelectedEspacioId('');
    setContratoDetalle(null);

    if (!contratoId) return;

    try {
      const res = await getEstadoCuenta(contratoId);
      setContratoDetalle(res.data);
      if (res.data.espacios_adquiridos && res.data.espacios_adquiridos.length === 1) {
        setSelectedEspacioId(res.data.espacios_adquiridos[0].id_espacio);
      }
    } catch (error) {
      console.error('Error al consultar estado de cuenta de contrato:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDifuntoId) {
      toast.error('Seleccione la persona fallecida objeto de la inhumación.');
      return;
    }
    if (!selectedContratoId) {
      toast.error('Seleccione el contrato comercial autorizante.');
      return;
    }
    if (!selectedEspacioId) {
      toast.error('Seleccione el espacio físico (nicho) asignado.');
      return;
    }
    if (!actaRenapFile) {
      toast.error('Debe adjuntar obligatoriamente el Acta de Defunción emitida por RENAP en formato PDF.');
      return;
    }

    setLoadingSave(true);
    try {
      const formData = new FormData();
      formData.append('difunto', selectedDifuntoId);
      formData.append('contrato', selectedContratoId);
      formData.append('espacio', selectedEspacioId);
      formData.append('fecha_sepelio', new Date(fechaSepelio).toISOString());
      formData.append('acta_renap_pdf', actaRenapFile);
      if (certificadoMspasFile) {
        formData.append('certificado_mspas_pdf', certificadoMspasFile);
      }
      if (observaciones) {
        formData.append('observaciones', observaciones);
      }

      await crearRegistroInhumacion(formData);
      toast.success('Inhumación autorizada y registrada exitosamente. Nicho actualizado a Ocupado.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al registrar inhumación:', error);
    } finally {
      setLoadingSave(false);
    }
  };

  const nichosDisponiblesContrato = contratoDetalle?.espacios_adquiridos || [];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-dark text-white py-3">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-flower1 text-success me-2"></i>
              Registro Operativo de Inhumación / Sepelio
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          {loadingCatalogos ? (
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary me-2"></div>
              <span>Cargando expedientes y disponibilidad de nichos...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {/* 1. Difunto */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">1. Persona Fallecida (Difunto) *</label>
                  <select
                    className="form-select form-select-lg"
                    value={selectedDifuntoId}
                    onChange={(e) => setSelectedDifuntoId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione una persona fallecida registrada --</option>
                    {difuntos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombres} {d.apellidos} {d.cui ? `(CUI: ${d.cui})` : '(Sin CUI)'} — Defunción: {d.fecha_defuncion}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Contrato Comercial Autorizante */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">2. Contrato Comercial Habilitante * (RF-05 Solvencia)</label>
                  <select
                    className="form-select"
                    value={selectedContratoId}
                    onChange={handleContratoChange}
                    required
                  >
                    <option value="">-- Seleccione el contrato del titular --</option>
                    {contratos.map((c) => (
                      <option key={c.id_contrato} value={c.id_contrato}>
                        Contrato #{c.numero_contrato} — Cliente: {c.cliente_nombre} (Estado: {c.estado_nombre})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tarjeta de Verificación de Solvencia del Contrato */}
                {contratoDetalle && (
                  <div className="p-3 mb-3 bg-light rounded border border-info">
                    <h6 className="fw-bold text-primary mb-2">
                      <i className="bi bi-shield-check me-1"></i> Verificación de Propiedad y Solvencia:
                    </h6>
                    <div className="row g-2 small text-dark">
                      <div className="col-md-6">
                        <strong>Titular:</strong> {contratoDetalle.cliente}
                      </div>
                      <div className="col-md-6">
                        <strong>Estado Contrato:</strong>{' '}
                        <span className="badge bg-success">{contratoDetalle.estado}</span>
                      </div>
                      <div className="col-md-6">
                        <strong>Cuotas Pendientes:</strong> {contratoDetalle.resumen_financiero?.cuotas_pendientes || 0}
                      </div>
                      <div className="col-md-6">
                        <strong>Mantenimientos en Mora:</strong>{' '}
                        {contratoDetalle.resumen_mantenimiento?.mantenimientos_en_mora > 0 ? (
                          <span className="badge bg-danger">
                            {contratoDetalle.resumen_mantenimiento.mantenimientos_en_mora} En Mora
                          </span>
                        ) : (
                          <span className="badge bg-success">Al Día</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Espacio Físico (Nicho) */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">3. Espacio Físico / Nicho Asignado *</label>
                  <select
                    className="form-select"
                    value={selectedEspacioId}
                    onChange={(e) => setSelectedEspacioId(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccione el nicho correspondiente --</option>
                    {nichosDisponiblesContrato.length > 0 ? (
                      nichosDisponiblesContrato.map((e) => (
                        <option key={e.id_espacio} value={e.id_espacio}>
                          {e.codigo_unico_espacio} — Sector: {e.sector} ({e.estructura})
                        </option>
                      ))
                    ) : (
                      espaciosDisponibles.map((e) => (
                        <option key={e.id_espacio} value={e.id_espacio}>
                          {e.codigo_unico_espacio} — Sector: {e.estructura_nombre} (Estado: {e.estado_nombre})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 4. Fecha y Hora de Sepelio */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">4. Fecha y Hora Programada de Sepelio *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={fechaSepelio}
                    onChange={(e) => setFechaSepelio(e.target.value)}
                    required
                  />
                </div>

                {/* 5. Documentos Anexos Legales / Sanitarios (PDFs) */}
                <div className="card border-secondary border-opacity-25 bg-light mb-3">
                  <div className="card-header bg-secondary bg-opacity-10 py-2">
                    <h6 className="fw-bold mb-0 text-dark">
                      <i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>
                      Documentos Sanitarios y Legales Anexos (RF-04)
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-dark">
                          Acta de Defunción RENAP (PDF) *
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          className="form-control form-control-sm"
                          onChange={(e) => setActaRenapFile(e.target.files[0] || null)}
                          required
                        />
                        <small className="text-muted d-block mt-1">Archivo PDF del acta de defunción</small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-dark">
                          Certificado Sanitarios MSPAS (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          className="form-control form-control-sm"
                          onChange={(e) => setCertificadoMspasFile(e.target.files[0] || null)}
                        />
                        <small className="text-muted d-block mt-1">Constancia sanitaria (opcional si aplica)</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark">Observaciones Operativas</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Instrucciones especiales para el personal de campo o notas relativas al servicio funeral..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={loadingSave}>
                  {loadingSave ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Validando y Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill me-1"></i> Autorizar e Inhumar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

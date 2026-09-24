import { useState } from 'react';
import toast from 'react-hot-toast';

export const ContactoPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    interes: 'Cotización de Nicho Individual',
    mensaje: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.telefono) {
      toast.error('Por favor complete su nombre y número de teléfono.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
      toast.success('¡Gracias por comunicarse! Un asesor de previsión se contactará en breve.');
    }, 800);
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-navy-dark text-white py-5 text-center">
        <div className="container py-3">
          <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold mb-2">
            Atención y Asistencia Familiar
          </span>
          <h1 className="fw-bold display-6 mb-2">Ubicación y Contacto</h1>
          <p className="lead text-white-50 fs-6 mx-auto mb-0" style={{ maxWidth: '680px' }}>
            Estamos a su servicio para orientarle en momentos de necesidad o planificar con anticipación la protección de su familia.
          </p>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Columna Izquierda: Información de Contacto y Horarios */}
            <div className="col-lg-5">
              {/* Tarjeta de Emergencias 24/7 */}
              <div className="card card-empathic p-4 border-start border-4 border-danger shadow-sm bg-white mb-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
                    <i className="bi bi-telephone-inbound-fill fs-3"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Línea de Emergencia 24/7</h5>
                    <p className="text-muted small mb-0">Atención inmediata en fallecimientos</p>
                  </div>
                </div>
                <div className="bg-light p-3 rounded-3 mt-2 text-center">
                  <div className="fs-4 fw-bold text-danger">PBX: (502) 7764-0000</div>
                  <div className="text-secondary small fw-semibold">WhatsApp Directo: (502) 4500-1122</div>
                </div>
              </div>

              {/* Tarjeta de Ubicación y Horarios */}
              <div className="card card-empathic p-4 border-0 shadow-sm bg-white mb-4">
                <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt-fill text-success"></i>
                  Ubicación del Camposanto
                </h6>

                <div className="d-flex flex-column gap-3 small text-secondary mb-4">
                  <div className="d-flex align-items-start gap-2.5">
                    <i className="bi bi-pin-map text-danger fs-5 mt-0.5"></i>
                    <div>
                      <strong className="text-dark d-block">Dirección Principal:</strong>
                      Kilómetro 220, Carretera Interamericana, Sector Los Robles, Huehuetenango, Guatemala.
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <i className="bi bi-clock text-warning fs-5 mt-0.5"></i>
                    <div>
                      <strong className="text-dark d-block">Horarios de Visitas al Camposanto:</strong>
                      Lunes a Domingo de 07:00 a 18:00 hrs (Horario continuo).
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <i className="bi bi-building text-primary fs-5 mt-0.5"></i>
                    <div>
                      <strong className="text-dark d-block">Oficinas Administrativas:</strong>
                      Lunes a Viernes de 08:00 a 17:00 hrs | Sábados de 08:00 a 12:00 hrs.
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <i className="bi bi-envelope-at text-info fs-5 mt-0.5"></i>
                    <div>
                      <strong className="text-dark d-block">Correo Electrónico Oficial:</strong>
                      info@cementerioshuehue.gt
                    </div>
                  </div>
                </div>

                {/* Mapa Referencial Visual */}
                <div className="bg-light rounded-3 p-4 text-center border">
                  <i className="bi bi-map fs-1 text-muted mb-2"></i>
                  <h6 className="fw-bold text-dark mb-1">Camposanto Memorial Los Robles</h6>
                  <p className="text-muted small mb-3">Huehuetenango, Guatemala (Zona Accesible)</p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary btn-sm fw-semibold"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Abrir en Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Formulario de Contacto y Asesoría */}
            <div className="col-lg-7">
              <div className="card card-empathic p-4 p-sm-5 border-0 shadow-sm bg-white">
                <h4 className="fw-bold text-dark mb-2">Solicitud de Asesoría y Previsión</h4>
                <p className="text-muted small mb-4">
                  Complete sus datos para recibir orientación sin compromiso sobre disponibilidad de nichos, planes de pago o servicios de inhumación.
                </p>

                {enviado ? (
                  <div className="text-center py-5">
                    <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex mb-3">
                      <i className="bi bi-check2-circle display-4"></i>
                    </div>
                    <h5 className="fw-bold text-dark">¡Solicitud Recibida Correctamente!</h5>
                    <p className="text-muted small mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      Hemos asignado a un asesor de previsión familiar para contactarle al número <strong>{formData.telefono}</strong> a la mayor brevedad posible.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEnviado(false);
                        setFormData({
                          nombre: '',
                          telefono: '',
                          correo: '',
                          interes: 'Cotización de Nicho Individual',
                          mensaje: ''
                        });
                      }}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-secondary fw-semibold small">
                          Nombre Completo *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-person text-muted"></i>
                          </span>
                          <input
                            type="text"
                            name="nombre"
                            required
                            className="form-control border-start-0"
                            placeholder="Ej. Carlos Mendoza"
                            value={formData.nombre}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-secondary fw-semibold small">
                          Número de Teléfono / Celular *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-phone text-muted"></i>
                          </span>
                          <input
                            type="tel"
                            name="telefono"
                            required
                            className="form-control border-start-0"
                            placeholder="Ej. 5544-3322"
                            value={formData.telefono}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-secondary fw-semibold small">
                          Correo Electrónico (Opcional)
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-envelope text-muted"></i>
                          </span>
                          <input
                            type="email"
                            name="correo"
                            className="form-control border-start-0"
                            placeholder="correo@ejemplo.com"
                            value={formData.correo}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-secondary fw-semibold small">
                          Tipo de Servicio de Interés
                        </label>
                        <select
                          name="interes"
                          className="form-select"
                          value={formData.interes}
                          onChange={handleChange}
                        >
                          <option value="Cotización de Nicho Individual">Nicho Individual en Pabellón</option>
                          <option value="Módulo Familiar (2 a 4 Espacios)">Módulo Familiar (2 a 4 Espacios)</option>
                          <option value="Mausoleo Privado">Mausoleo Familiar Privado</option>
                          <option value="Servicio de Inhumación Inmediata">Servicio de Inhumación Inmediata</option>
                          <option value="Trámite de Exhumación o Traslado">Trámite de Exhumación o Traslado</option>
                          <option value="Otra Consulta">Otra Consulta General</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label text-secondary fw-semibold small">
                          Mensaje o Detalles de la Consulta
                        </label>
                        <textarea
                          name="mensaje"
                          rows="4"
                          className="form-control"
                          placeholder="Escriba aquí sus comentarios o preguntas..."
                          value={formData.mensaje}
                          onChange={handleChange}
                        ></textarea>
                      </div>

                      <div className="col-12 mt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn btn-secondary-custom w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              <span>Enviando solicitud...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send-fill"></i>
                              <span>Enviar Solicitud de Contacto</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

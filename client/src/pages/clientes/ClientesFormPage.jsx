import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { crearCliente, obtenerCliente, actualizarCliente, obtenerUsuarios } from '../../api/cuentas.api';
import toast from 'react-hot-toast';

export const ClientesFormPage = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const currentUsuarioId = watch('usuario');

  useEffect(() => {
    const initData = async () => {
      let clientCurrentUserId = null;

      // 1. Cargar datos del cliente si estamos editando
      if (isEditing) {
        setLoading(true);
        try {
          const res = await obtenerCliente(id);
          const data = res.data;
          setValue('cui', data.cui);
          setValue('nombres', data.nombres);
          setValue('apellidos', data.apellidos);
          setValue('telefono', data.telefono || '');
          setValue('correo', data.correo || '');
          setValue('direccion', data.direccion || '');
          setValue('usuario', data.usuario || '');
          clientCurrentUserId = data.usuario;
        } catch (err) {
          console.error('Error al cargar datos de cliente:', err);
          toast.error('No se pudo obtener la información del cliente.');
          navigate('/clientes');
        } finally {
          setLoading(false);
        }
      }

      // 2. Cargar lista de usuarios y aplicar filtros (Observación 1 y 3)
      try {
        const resUsers = await obtenerUsuarios();
        if (Array.isArray(resUsers.data)) {
          setTodosUsuarios(resUsers.data);

          // Filtrar usuarios:
          // a) Solamente de tipo "Cliente Propietario" (Observación 1)
          // b) Solamente usuarios sin cliente asignado (cliente_id == null) O el usuario actualmente asignado a este cliente (Observación 3)
          const filtrados = resUsers.data.filter((u) => {
            const esRolCliente = u.rol_nombre === 'Cliente Propietario';
            const sinClienteAsignado = !u.cliente_id || u.cliente_id === null;
            const esElAsignadoActual = isEditing && clientCurrentUserId && u.id === clientCurrentUserId;

            return esRolCliente && (sinClienteAsignado || esElAsignadoActual);
          });

          setUsuariosDisponibles(filtrados);
        }
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
      }
    };

    initData();
  }, [id, isEditing, setValue, navigate]);

  // Handler para auto-completar datos al seleccionar un usuario (Caso 2 - Observación 2)
  const handleUsuarioChange = (e) => {
    const userId = e.target.value;
    setValue('usuario', userId);

    if (userId) {
      const usuarioSeleccionado = todosUsuarios.find((u) => u.id === parseInt(userId, 10));
      if (usuarioSeleccionado) {
        if (usuarioSeleccionado.first_name) setValue('nombres', usuarioSeleccionado.first_name);
        if (usuarioSeleccionado.last_name) setValue('apellidos', usuarioSeleccionado.last_name);
        if (usuarioSeleccionado.email) setValue('correo', usuarioSeleccionado.email);
        if (usuarioSeleccionado.telefono) setValue('telefono', usuarioSeleccionado.telefono);

        toast.success(`Datos auto-completados desde la cuenta de usuario "${usuarioSeleccionado.username}"`, {
          icon: '✨',
        });
      }
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      usuario: data.usuario ? parseInt(data.usuario, 10) : null,
    };

    setLoading(true);
    try {
      if (isEditing) {
        await actualizarCliente(id, payload);
        toast.success('Cliente actualizado correctamente.');
      } else {
        await crearCliente(payload);
        toast.success('Cliente registrado exitosamente.');
      }
      navigate('/clientes');
    } catch (err) {
      console.error('Error al guardar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {isEditing ? 'Editar Cliente / Titular' : 'Registrar Nuevo Cliente'}
          </h3>
          <p className="text-muted mb-0">Complete la información general del titular</p>
        </div>
        <Link to="/clientes" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Volver a la Lista
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              {/* Usuario Vinculado (Filtrado por Cliente Propietario y Relación 1-1) */}
              <div className="col-12 bg-light p-3 rounded border mb-2">
                <label className="form-label fw-bold text-primary mb-1">
                  <i className="bi bi-person-check me-2"></i>
                  Cuenta de Usuario del Sistema (Rol: Cliente Propietario)
                </label>
                <select
                  className="form-select border-primary"
                  value={currentUsuarioId || ''}
                  onChange={handleUsuarioChange}
                >
                  <option value="">-- Sin Cuenta de Usuario Asociada --</option>
                  {usuariosDisponibles.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.first_name || u.email || 'Sin nombre'}) - ID: #{u.id}
                    </option>
                  ))}
                </select>
                <div className="form-text mt-1 text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Al seleccionar un usuario, se completarán automáticamente los nombres, apellidos, correo y teléfono.
                  Solo se muestran usuarios activos con rol <strong>Cliente Propietario</strong> no vinculados a otros titulares.
                </div>
              </div>

              {/* CUI */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">CUI / DPI <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.cui ? 'is-invalid' : ''}`}
                  placeholder="Ej. 1234567890101"
                  maxLength={13}
                  {...register('cui', {
                    required: 'El CUI es obligatorio',
                    pattern: {
                      value: /^[0-9]{9,13}$/,
                      message: 'El CUI debe tener entre 9 y 13 dígitos numéricos',
                    },
                  })}
                />
                {errors.cui && <div className="invalid-feedback">{errors.cui.message}</div>}
              </div>

              {/* Teléfono */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 55554444"
                  {...register('telefono')}
                />
              </div>

              {/* Nombres */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nombres <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.nombres ? 'is-invalid' : ''}`}
                  placeholder="Ej. Juan Carlos"
                  {...register('nombres', { required: 'Los nombres son obligatorios' })}
                />
                {errors.nombres && <div className="invalid-feedback">{errors.nombres.message}</div>}
              </div>

              {/* Apellidos */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Apellidos <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.apellidos ? 'is-invalid' : ''}`}
                  placeholder="Ej. Pérez Gómez"
                  {...register('apellidos', { required: 'Los apellidos son obligatorios' })}
                />
                {errors.apellidos && <div className="invalid-feedback">{errors.apellidos.message}</div>}
              </div>

              {/* Correo Electrónico */}
              <div className="col-md-12">
                <label className="form-label fw-semibold">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  {...register('correo')}
                />
              </div>

              {/* Dirección */}
              <div className="col-12">
                <label className="form-label fw-semibold">Dirección de Residencia</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Zona, municipio, departamento..."
                  {...register('direccion')}
                ></textarea>
              </div>

              {/* Botones de Acción */}
              <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Link to="/clientes" className="btn btn-light">
                  Cancelar
                </Link>
                <button type="submit" disabled={loading} className="btn btn-primary d-flex align-items-center gap-2">
                  {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <i className="bi bi-check-circle"></i>
                  <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

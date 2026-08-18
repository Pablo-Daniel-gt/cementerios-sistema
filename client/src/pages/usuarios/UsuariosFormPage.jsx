import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  crearUsuario,
  obtenerUsuario,
  actualizarUsuario,
  obtenerRoles,
  obtenerClientes,
  actualizarCliente,
} from '../../api/cuentas.api';
import toast from 'react-hot-toast';

export const UsuariosFormPage = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [roles, setRoles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [todosClientes, setTodosClientes] = useState([]);
  const [clienteInicialId, setClienteInicialId] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const currentRolId = watch('rol');
  const currentClienteId = watch('cliente_vinculado');

  // Encontrar el nombre del rol seleccionado
  const rolSeleccionado = roles.find((r) => r.id === parseInt(currentRolId, 10));
  const esRolCliente = rolSeleccionado?.nombre === 'Cliente Propietario';

  useEffect(() => {
    const initData = async () => {
      let userClienteId = null;

      // 1. Cargar roles disponibles
      try {
        const resRoles = await obtenerRoles();
        if (Array.isArray(resRoles.data)) {
          setRoles(resRoles.data);
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
      }

      // 2. Si es edición, cargar datos del usuario
      if (isEditing) {
        setLoading(true);
        try {
          const res = await obtenerUsuario(id);
          const data = res.data;
          setValue('username', data.username);
          setValue('email', data.email);
          setValue('first_name', data.first_name || '');
          setValue('last_name', data.last_name || '');
          setValue('telefono', data.telefono || '');
          setValue('rol', data.rol || '');
          setValue('is_active', data.is_active);

          if (data.cliente_id) {
            setValue('cliente_vinculado', data.cliente_id);
            setClienteInicialId(data.cliente_id);
            userClienteId = data.cliente_id;
          }
        } catch (err) {
          console.error('Error al cargar datos del usuario:', err);
          toast.error('No se pudieron obtener los datos del usuario.');
          navigate('/usuarios');
        } finally {
          setLoading(false);
        }
      }

      // 3. Cargar clientes disponibles para asignación inversa (Caso 1 - Observación 2 y 3)
      try {
        const resClientes = await obtenerClientes();
        if (Array.isArray(resClientes.data)) {
          setTodosClientes(resClientes.data);

          // Filtrar clientes no asignados a ningún otro usuario (c.usuario == null)
          // O el cliente asignado actualmente a este usuario
          const filtrados = resClientes.data.filter((c) => {
            const sinUsuario = !c.usuario || c.usuario === null;
            const esElAsignadoActual = isEditing && userClienteId && c.id === userClienteId;
            return sinUsuario || esElAsignadoActual;
          });

          setClientesDisponibles(filtrados);
        }
      } catch (err) {
        console.error('Error al obtener clientes:', err);
      }
    };

    initData();
  }, [id, isEditing, setValue, navigate]);

  // Handler al seleccionar un cliente existente (Caso 1 - Observación 2)
  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    setValue('cliente_vinculado', clienteId);

    if (clienteId) {
      const clienteSel = todosClientes.find((c) => c.id === parseInt(clienteId, 10));
      if (clienteSel) {
        if (clienteSel.nombres) setValue('first_name', clienteSel.nombres);
        if (clienteSel.apellidos) setValue('last_name', clienteSel.apellidos);
        if (clienteSel.correo) setValue('email', clienteSel.correo);
        if (clienteSel.telefono) setValue('telefono', clienteSel.telefono);

        toast.success(`Datos auto-completados desde la ficha del cliente "${clienteSel.nombres} ${clienteSel.apellidos}"`, {
          icon: '✨',
        });
      }
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      username: data.username,
      email: data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      telefono: data.telefono || '',
      rol: data.rol ? parseInt(data.rol, 10) : null,
      is_active: data.is_active,
    };

    if (data.password) {
      payload.password = data.password;
    }

    const selectedClienteId = data.cliente_vinculado ? parseInt(data.cliente_vinculado, 10) : null;

    setLoading(true);
    try {
      let savedUser = null;

      if (isEditing) {
        const res = await actualizarUsuario(id, payload);
        savedUser = res.data;
        toast.success('Usuario actualizado correctamente.');
      } else {
        const res = await crearUsuario(payload);
        savedUser = res.data;
        toast.success('Usuario creado exitosamente.');
      }

      // Procesar vinculación inversa con Cliente (Caso 1)
      if (savedUser && savedUser.id) {
        const userId = savedUser.id;

        // Si se seleccionó un cliente y es distinto al inicial, asignarlo
        if (selectedClienteId && selectedClienteId !== clienteInicialId) {
          const clienteTarget = todosClientes.find((c) => c.id === selectedClienteId);
          if (clienteTarget) {
            await actualizarCliente(selectedClienteId, {
              ...clienteTarget,
              usuario: userId,
            });
            toast.success(`Cuenta vinculada exitosamente al cliente #${selectedClienteId}`);
          }
        }

        // Si se desvinculó el cliente previo, liberar la relación
        if (clienteInicialId && selectedClienteId !== clienteInicialId) {
          const clientePrevio = todosClientes.find((c) => c.id === clienteInicialId);
          if (clientePrevio) {
            await actualizarCliente(clienteInicialId, {
              ...clientePrevio,
              usuario: null,
            });
          }
        }
      }

      navigate('/usuarios');
    } catch (err) {
      console.error('Error al guardar usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {isEditing ? 'Editar Usuario de Sistema' : 'Crear Nuevo Usuario'}
          </h3>
          <p className="text-muted mb-0">Asigne el rol y permisos de acceso</p>
        </div>
        <Link to="/usuarios" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Volver a la Lista
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              {/* Rol */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Rol de Sistema <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.rol ? 'is-invalid' : ''}`}
                  {...register('rol', { required: 'Debe seleccionar un rol para el usuario' })}
                >
                  <option value="">-- Seleccionar Rol --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                {errors.rol && <div className="invalid-feedback">{errors.rol.message}</div>}
              </div>

              {/* Username */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nombre de Usuario (Username) <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Ej. pablo_admin"
                  {...register('username', { required: 'El usuario es obligatorio' })}
                />
                {errors.username && <div className="invalid-feedback">{errors.username.message}</div>}
              </div>

              {/* Asignación Inversa: Selección de Cliente Existente (Si Rol es Cliente Propietario) */}
              {esRolCliente && (
                <div className="col-12 bg-light p-3 rounded border my-2">
                  <label className="form-label fw-bold text-success mb-1">
                    <i className="bi bi-person-bounding-box me-2"></i>
                    Vincular a Titular / Cliente Existente
                  </label>
                  <select
                    className="form-select border-success"
                    value={currentClienteId || ''}
                    onChange={handleClienteChange}
                  >
                    <option value="">Sin Cliente Asociado (Crear Cuenta Nueva)</option>
                    {clientesDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} (DPI: {c.cui})
                      </option>
                    ))}
                  </select>
                  <div className="form-text mt-1 text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Si selecciona un cliente registrado, sus nombres, correo y teléfono se completarán automáticamente en esta cuenta de usuario.
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Correo Electrónico <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="usuario@cementerio.com"
                  {...register('email', { required: 'El correo electrónico es obligatorio' })}
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>

              {/* Contraseña */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Contraseña {isEditing ? '(Dejar en blanco para conservar)' : <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: !isEditing ? 'La contraseña es obligatoria' : false,
                    minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
                  })}
                />
                {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              </div>

              {/* Nombres */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nombres</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombres del usuario"
                  {...register('first_name')}
                />
              </div>

              {/* Apellidos */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Apellidos</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Apellidos del usuario"
                  {...register('last_name')}
                />
              </div>

              {/* Teléfono */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Número de contacto"
                  {...register('telefono')}
                />
              </div>

              {/* Estado Activo */}
              <div className="col-md-6 d-flex align-items-center">
                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="is_active"
                    defaultChecked={true}
                    {...register('is_active')}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="is_active">
                    Cuenta Activa (Permite Iniciar Sesión)
                  </label>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Link to="/usuarios" className="btn btn-light">
                  Cancelar
                </Link>
                <button type="submit" disabled={loading} className="btn btn-success d-flex align-items-center gap-2">
                  {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <i className="bi bi-check-circle"></i>
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

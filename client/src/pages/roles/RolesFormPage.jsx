import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { crearRol, obtenerRol, actualizarRol } from '../../api/cuentas.api';
import toast from 'react-hot-toast';

export const RolesFormPage = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      const loadRol = async () => {
        setLoading(true);
        try {
          const res = await obtenerRol(id);
          const data = res.data;
          setValue('nombre', data.nombre);
          setValue('descripcion', data.descripcion || '');
        } catch (err) {
          console.error('Error al cargar rol:', err);
          toast.error('No se pudo obtener la información del rol.');
          navigate('/roles');
        } finally {
          setLoading(false);
        }
      };
      loadRol();
    }
  }, [id, isEditing, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        await actualizarRol(id, data);
        toast.success('Rol actualizado correctamente.');
      } else {
        await crearRol(data);
        toast.success('Rol registrado exitosamente.');
      }
      navigate('/roles');
    } catch (err) {
      console.error('Error al guardar rol:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h3>
          <p className="text-muted mb-0">Defina el nombre y descripción del nivel de acceso</p>
        </div>
        <Link to="/roles" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Volver a la Lista
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nombre de Rol <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                placeholder="Ej. Administrador, Asesor Comercial"
                {...register('nombre', { required: 'El nombre del rol es obligatorio' })}
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Descripción del Rol</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describa el alcance de permisos y responsabilidades..."
                {...register('descripcion')}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Link to="/roles" className="btn btn-light">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="btn btn-warning d-flex align-items-center gap-2">
                {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <i className="bi bi-check-circle"></i>
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Rol'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

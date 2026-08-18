import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const result = await login(data);

    if (result.success) {
      const userRole = result.user.rol;
      if (userRole === 'Cliente Propietario') {
        navigate('/portal-cliente');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-secondary bg-gradient">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="bg-primary text-white d-inline-flex p-3 rounded-circle mb-3 shadow">
              <i className="bi bi-bank fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">Inicio de Sesión</h4>
            <p className="text-muted small">Sistema Web Cementerios Privados</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nombre de Usuario</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Ej. Jesús123"
                  {...register('username', { required: 'El usuario es obligatorio' })}
                />
              </div>
              {errors.username && (
                <div className="invalid-feedback d-block">{errors.username.message}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password.message}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <span>¿Problemas para acceder? Contacte al Administrador.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

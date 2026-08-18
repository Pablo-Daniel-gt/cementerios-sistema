import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos y el rol del usuario no está en la lista
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Si es Cliente Propietario redirigir a portal-cliente, de lo contrario a dashboard
    if (role === 'Cliente Propietario') {
      return <Navigate to="/portal-cliente" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientesPage } from '../pages/clientes/ClientesPage';
import { ClientesFormPage } from '../pages/clientes/ClientesFormPage';
import { UsuariosPage } from '../pages/usuarios/UsuariosPage';
import { UsuariosFormPage } from '../pages/usuarios/UsuariosFormPage';
import { RolesPage } from '../pages/roles/RolesPage';
import { RolesFormPage } from '../pages/roles/RolesFormPage';
import { BitacoraPage } from '../pages/bitacora/BitacoraPage';
import { PortalClientePage } from '../pages/portal_cliente/PortalClientePage';
import { InventarioPage } from '../pages/inventario/InventarioPage';
import { EstructurasPage } from '../pages/inventario/EstructurasPage';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export const AppRouter = () => {
  const { isAuthenticated, role } = useAuth();

  // Función para determinar la ruta por defecto según el rol
  const getDefaultRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (role === 'Cliente Propietario') return <Navigate to="/portal-cliente" replace />;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Ruta Pública: Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            role === 'Cliente Propietario' ? (
              <Navigate to="/portal-cliente" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Rutas Protegidas dentro de Layout */}
      <Route element={<Layout />}>
        {/* Dashboard: Administrador, Asesor Comercial, Secretaria */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Asesor Comercial', 'Secretaria']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Módulo B - Inventario de Camposanto (Matriz 2D): Administrador, Asesor Comercial, Secretaria */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Asesor Comercial', 'Secretaria']} />}>
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/inventario/estructuras" element={<EstructurasPage />} />
        </Route>

        {/* Clientes: Administrador, Asesor Comercial, Secretaria */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Asesor Comercial', 'Secretaria']} />}>
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/nuevo" element={<ClientesFormPage />} />
          <Route path="/clientes/editar/:id" element={<ClientesFormPage />} />
        </Route>

        {/* Usuarios: Exclusivo Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/usuarios/nuevo" element={<UsuariosFormPage />} />
          <Route path="/usuarios/editar/:id" element={<UsuariosFormPage />} />
        </Route>

        {/* Roles: Exclusivo Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/roles/nuevo" element={<RolesFormPage />} />
          <Route path="/roles/editar/:id" element={<RolesFormPage />} />
        </Route>

        {/* Bitácora: Exclusivo Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
          <Route path="/bitacora" element={<BitacoraPage />} />
        </Route>

        {/* Portal Cliente: Exclusivo Cliente Propietario (RF-03) */}
        <Route element={<ProtectedRoute allowedRoles={['Cliente Propietario']} />}>
          <Route path="/portal-cliente" element={<PortalClientePage />} />
        </Route>
      </Route>

      {/* Redirección por defecto para cualquier otra URL */}
      <Route path="*" element={getDefaultRedirect()} />
    </Routes>
  );
};

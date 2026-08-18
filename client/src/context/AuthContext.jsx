import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi } from '../api/cuentas.api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Inicialización sincrónica desde localStorage para prevenir parpadeos o pérdida de sesión en F5
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const role = user?.rol || null;
  const isAuthenticated = !!token && !!user;

  // Método para Iniciar Sesión
  const login = async (credenciales) => {
    setLoading(true);
    try {
      const response = await loginApi(credenciales);
      const { token: userToken, user: userData } = response.data;

      setToken(userToken);
      setUser(userData);

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success(`Bienvenido(a), ${userData.first_name || userData.username}`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Error en autenticación:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Método para Cerrar Sesión
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Sesión cerrada correctamente.');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

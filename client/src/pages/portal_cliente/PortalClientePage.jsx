import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerClientes } from '../../api/cuentas.api';

export const PortalClientePage = () => {
  const { user } = useAuth();
  const [clienteInfo, setClienteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClienteData = async () => {
      setLoading(true);
      try {
        const res = await obtenerClientes();
        if (Array.isArray(res.data)) {
          // Buscar el cliente asociado al ID del usuario actual o con su email/username
          const match = res.data.find(
            (c) => c.usuario === user?.id || (c.correo && c.correo.toLowerCase() === user?.email?.toLowerCase())
          );
          if (match) {
            setClienteInfo(match);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de cliente:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClienteData();
  }, [user]);

  return (
    <div>
      <div className="bg-primary text-white p-4 rounded-3 mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white text-primary p-3 rounded-circle">
            <i className="bi bi-person-workspace fs-2"></i>
          </div>
          <div>
            <h3 className="fw-bold mb-1">Portal del Cliente Propietario</h3>
            <p className="mb-0 text-white-50">
              Bienvenido(a), <span className="text-white fw-semibold">{user?.first_name || user?.username}</span>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando su información personal...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Información del Perfil */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-person-vcard me-2 text-primary"></i>
                  Datos Personales del Titular
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">CUI / DPI:</span>
                    <span className="fw-bold text-dark">{clienteInfo?.cui || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Nombre Completo:</span>
                    <span className="fw-semibold">
                      {clienteInfo ? `${clienteInfo.nombres} ${clienteInfo.apellidos}` : `${user?.first_name || ''} ${user?.last_name || ''}`}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Teléfono:</span>
                    <span>{clienteInfo?.telefono || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2">
                    <span className="text-muted">Correo Electrónico:</span>
                    <span>{clienteInfo?.correo || user?.email || 'No registrado'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0 py-2 border-0">
                    <span className="text-muted">Dirección:</span>
                    <span>{clienteInfo?.direccion || 'No registrada'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Estado de Cuenta / Lotes Propios */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                  Mis Contratos y Estado de Cuenta
                </h5>
                <span className="badge bg-success-subtle text-success border border-success-subtle">Al Día</span>
              </div>
              <div className="card-body">
                <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-3">
                  <i className="bi bi-info-circle-fill fs-3 text-info"></i>
                  <div>
                    <strong className="d-block">Información de Contratos Activos</strong>
                    <span>Sus servicios de cementerio y estado de cuenta se sincronizarán al habilitarse el Módulo Comercial.</span>
                  </div>
                </div>

                <div className="p-3 bg-light rounded text-center text-muted my-3">
                  <i className="bi bi-building-check fs-2 d-block mb-1 text-secondary"></i>
                  <span>No tiene cuotas pendientes de pago en este momento.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

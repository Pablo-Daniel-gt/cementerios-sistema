import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
          <div className="card shadow border-0 rounded-4 p-4 p-md-5 text-center" style={{ maxWidth: '560px' }}>
            <div className="mb-3 d-inline-flex p-3 rounded-circle bg-danger-subtle text-danger mx-auto">
              <i className="bi bi-exclamation-triangle-fill display-5"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Ha ocurrido un problema inesperado</h4>
            <p className="text-muted small mb-4">
              La aplicación detectó un estado irregular al renderizar los datos. Puede recargar o regresar al inicio de la plataforma.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-semibold"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Recargar
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
                onClick={this.handleReset}
              >
                <i className="bi bi-house me-1"></i> Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

export const VisorPDFModal = ({ title, pdfUrl, onClose }) => {
  if (!pdfUrl) return null;

  // Construir la URL completa si es relativa
  const fullUrl = pdfUrl.startsWith('http')
    ? pdfUrl
    : `http://127.0.0.1:8000${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered style-modal-pdf" style={{ height: '90vh' }}>
        <div className="modal-content h-100 shadow border-0">
          <div className="modal-header bg-dark text-white py-2">
            <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
              {title || 'Visor de Documento Digital PDF'}
            </h6>
            <div className="d-flex align-items-center gap-2">
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
              >
                <i className="bi bi-download"></i> Abrir / Descargar
              </a>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>
          <div className="modal-body p-0 bg-secondary bg-opacity-10 h-100">
            <iframe
              src={fullUrl}
              title={title || 'Documento PDF'}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

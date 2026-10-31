import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Telemetría de Error Capturada por ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            color: '#fff',
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              width: '100%',
              background: 'rgba(8, 16, 12, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)',
              borderRadius: '12px',
              padding: '2.5rem',
            }}
          >
            <div
              style={{
                fontSize: '2.5rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#f87171',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              [ ANOMALÍA EN SISTEMA // REINICIO DISPONIBLE ]
            </span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>
              Interrupción Temporal en la Interfaz
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Ha ocurrido una excepción inesperada durante la renderización del módulo. Tus datos locales y pedidos permanecen seguros en la base de datos.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-bio-primary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                ⟳ Recargar Página
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-bio-secondary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                ← Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

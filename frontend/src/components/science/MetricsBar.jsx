import React from 'react'

export default function MetricsBar() {
  return (
    <section className="bio-metrics-bar" id="beneficios">
      <div className="metrics-strip">
        <div className="metric-item">
          <span className="metric-number">100%</span>
          <span className="metric-tag">CALIDAD GARANTIZADA</span>
          <p className="metric-desc">
            Fórmulas y extractos puros seleccionados bajo los más altos estándares de calidad.
          </p>
        </div>
        <div className="metric-item">
          <span className="metric-number">RÁPIDO</span>
          <span className="metric-tag">ENTREGAS RÁPIDAS</span>
          <p className="metric-desc">
            Envíos ágiles, puntuales y seguros directo a tu puerta en todo el Perú.
          </p>
        </div>
        <div className="metric-item">
          <span className="metric-number">100%</span>
          <span className="metric-tag">COMPRA SEGURA</span>
          <p className="metric-desc">
            Pagos protegidos y confirmación inmediata de tu pedido.
          </p>
        </div>
        <div className="metric-item">
          <span className="metric-number">DIRECTA</span>
          <span className="metric-tag">ATENCIÓN PERSONALIZADA</span>
          <p className="metric-desc">
            Asesoría cercana para acompañarte en tu elección y resolver cualquier duda.
          </p>
        </div>
      </div>
    </section>
  )
}

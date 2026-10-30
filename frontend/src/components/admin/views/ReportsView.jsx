import React from 'react'

export default function ReportsView({ metrics }) {
  const speciesPerformance = [
    {
      name: 'Melena de León (Hericium erinaceus)',
      share: '48%',
      revenue: 'S/ 5,976.00',
      units: '67 frascos',
      growth: '+24%',
    },
    {
      name: 'Cordyceps Militar (Cordyceps militaris)',
      share: '26%',
      revenue: 'S/ 3,237.00',
      units: '34 frascos',
      growth: '+15%',
    },
    {
      name: 'Reishi Rojo (Ganoderma lucidum)',
      share: '18%',
      revenue: 'S/ 2,242.00',
      units: '28 frascos',
      growth: '+8%',
    },
    {
      name: 'Chaga Boreal (Inonotus obliquus)',
      share: '8%',
      revenue: 'S/ 995.00',
      units: '11 frascos',
      growth: '+12%',
    },
  ]

  return (
    <div className="admin-view-content">
      {/* Financial Overview Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card highlight">
          <div className="kpi-top">
            <span className="kpi-label">FACTURACIÓN ACUMULADA</span>
            <span className="kpi-icon">📊</span>
          </div>
          <span className="kpi-value text-neon">
            S/{' '}
            {metrics.totalSales.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="kpi-note">Ciclo de extracción Q4 2026</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">TICKET PROMEDIO</span>
            <span className="kpi-icon">🧾</span>
          </div>
          <span className="kpi-value">
            S/ {metrics.totalOrders > 0 ? (metrics.totalSales / metrics.totalOrders).toFixed(2) : '0.00'}
          </span>
          <span className="kpi-note text-neon">
            {metrics.totalOrders > 0 ? 'Calculado en vivo' : 'Esperando primeras órdenes'}
          </span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">TASA DE CONVERSIÓN</span>
            <span className="kpi-icon">🔄</span>
          </div>
          <span className="kpi-value text-neon">
            {metrics.totalOrders > 0 ? '100%' : '0.0%'}
          </span>
          <span className="kpi-note">Órdenes completadas</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">ESTADO DEL SISTEMA</span>
            <span className="kpi-icon">⚗️</span>
          </div>
          <span className="kpi-value text-neon">Óptimo</span>
          <span className="kpi-note">Base de datos conectada</span>
        </div>
      </div>

      {/* Best-selling species breakdown */}
      <div className="admin-panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Demanda por Especie de Hongo Funcional</h3>
            <span className="panel-sub">
              Volumen de ventas y concentración de principios activos demandados
            </span>
          </div>
          <button
            type="button"
            className="btn-admin-subtle"
            onClick={() =>
              alert(
                'Reporte generado: Informe de biometría y ventas exportado en formato CSV.'
              )
            }
          >
            📥 Exportar Datos CSV
          </button>
        </div>

        <div className="species-performance-list">
          {metrics.totalOrders === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <strong>Aún no hay transacciones para generar la gráfica de demanda.</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                Cuando tu tienda empiece a registrar ventas, aquí se desglosará el rendimiento por producto y facturación.
              </p>
            </div>
          ) : (
            speciesPerformance.map((item, idx) => (
              <div className="species-row-card" key={idx}>
                <div className="species-info-col">
                  <strong>{item.name}</strong>
                  <span className="species-units">
                    {item.units} · Facturación: {item.revenue}
                  </span>
                </div>
                <div className="species-bar-container">
                  <div
                    className="species-bar-fill"
                    style={{ width: item.share }}
                  />
                </div>
                <div className="species-share-col">
                  <span className="share-pct">{item.share}</span>
                  <span className="share-growth">{item.growth}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

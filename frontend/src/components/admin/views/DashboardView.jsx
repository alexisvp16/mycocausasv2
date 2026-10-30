import React from 'react'

export default function DashboardView({
  metrics,
  orders,
  inventory,
  onNavigateTab,
  onUpdateOrderStatus,
}) {
  const recentOrders = orders.slice(0, 5)
  const lowStockItems = inventory.filter((i) => i.unitsAvailable <= i.thresholdMin)

  return (
    <div className="admin-view-content">
      {/* KPI Cards Row */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card highlight">
          <div className="kpi-top">
            <span className="kpi-label">INGRESOS TOTALES</span>
            <span className="kpi-icon">💰</span>
          </div>
          <span className="kpi-value text-neon">
            S/ {metrics.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="kpi-note">↑ +18.4% vs mes anterior</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">PEDIDOS PENDIENTES</span>
            <span className="kpi-icon">📦</span>
          </div>
          <span className="kpi-value">
            {metrics.pendingOrders}{' '}
            <small className="kpi-subtext">/ {metrics.totalOrders} totales</small>
          </span>
          <span className="kpi-note text-warning">Requieren preparación y despacho</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">LOTES BAJO STOCK</span>
            <span className="kpi-icon">⚠️</span>
          </div>
          <span className="kpi-value">
            {metrics.lowStockCount}{' '}
            <small className="kpi-subtext">lotes críticos</small>
          </span>
          <span className="kpi-note text-danger">Reordenar cultivo micelial</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">USUARIOS REGISTRADOS</span>
            <span className="kpi-icon">👥</span>
          </div>
          <span className="kpi-value">{metrics.totalUsers}</span>
          <span className="kpi-note text-neon">100% verificados</span>
        </div>
      </div>

      {/* Main Grid: Orders Feed + Quick Alert Hub */}
      <div className="admin-dashboard-split">
        {/* Recent Orders Section */}
        <div className="admin-panel-card flex-2">
          <div className="panel-card-header">
            <div>
              <h3>Últimos Pedidos Registrados</h3>
              <span className="panel-sub">Órdenes recibidas vía web y WhatsApp</span>
            </div>
            <button
              type="button"
              className="btn-admin-subtle"
              onClick={() => onNavigateTab('pedidos')}
            >
              Ver todos ({orders.length}) ↗
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
                      📦 Aún no hay pedidos registrados. Cuando tus clientes compren en la tienda, aparecerán aquí en tiempo real.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span className="order-id-badge">{ord.id}</span>
                      </td>
                      <td>
                        <strong>{ord.customer}</strong>
                        <span className="cell-sub">{ord.phone}</span>
                      </td>
                      <td>{ord.city}</td>
                      <td>
                        <strong>S/ {ord.total.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`status-pill ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-select-status"
                          value={ord.status}
                          onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Preparación">En Preparación</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts + Quick Actions */}
        <div className="admin-panel-card flex-1">
          <div className="panel-card-header">
            <div>
              <h3>Alertas de Inventario Crítico</h3>
              <span className="panel-sub">Lotes con stock bajo umbral mínimo</span>
            </div>
          </div>

          <div className="low-stock-list">
            {lowStockItems.length === 0 ? (
              <p className="empty-alert-msg">✓ Todos los lotes tienen niveles óptimos.</p>
            ) : (
              lowStockItems.map((item) => (
                <div className="alert-item-card" key={item.batchCode}>
                  <div className="alert-top">
                    <span className="alert-batch">{item.batchCode}</span>
                    <span className="badge-danger">{item.unitsAvailable} unidades</span>
                  </div>
                  <strong className="alert-species">{item.species}</strong>
                  <span className="alert-threshold">
                    Umbral mínimo requerido: {item.thresholdMin} unidades
                  </span>
                  <button
                    type="button"
                    className="btn-refill-batch"
                    onClick={() => onNavigateTab('inventario')}
                  >
                    Reponer Stock en Lote ↗
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="quick-access-box">
            <span className="quick-title">ACCESOS RÁPIDOS DEL LABORATORIO:</span>
            <div className="quick-buttons-col">
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => onNavigateTab('productos')}
              >
                🍄 Añadir Nueva Variedad / Fórmula
              </button>
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => onNavigateTab('inventario')}
              >
                🔬 Registrar Certificado HPLC (COA)
              </button>
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => onNavigateTab('reportes')}
              >
                📊 Exportar Balance del Mes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

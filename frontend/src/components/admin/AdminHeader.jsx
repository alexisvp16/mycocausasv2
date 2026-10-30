import React from 'react'
import { useAuth } from '../../context/useAuth'

export default function AdminHeader({ activeTab }) {
  const { user } = useAuth()

  const titlesMap = {
    dashboard: 'Visión General & Telemetría del Laboratorio',
    pedidos: 'Gestión de Pedidos & Envíos',
    productos: 'Catálogo de Fórmulas y Especímenes',
    inventario: 'Control de Lotes HPLC & Stock Crítico',
    usuarios: 'Directorio de Investigadores y Clientes',
    cupones: 'Gestión de Cupones de Descuento & Promociones',
    reportes: 'Análisis de Rendimiento & Métricas Financieras',
  }

  return (
    <header className="admin-header">
      <div className="admin-header-title-box">
        <span className="admin-breadcrumb">
          LAB ADMIN // <strong>{activeTab.toUpperCase()}</strong>
        </span>
        <h1 className="admin-page-title">{titlesMap[activeTab] || 'Panel'}</h1>
      </div>

      <div className="admin-header-telemetry">
        <div className="server-status-pill">
          <span className="live-dot" />
          <span>SERVER // EN LÍNEA (LATENCIA: 18ms)</span>
        </div>

        <div className="admin-user-pill">
          <span className="admin-avatar">👩‍🔬</span>
          <div className="admin-user-info">
            <span className="admin-name">{user?.name || 'Administrador'}</span>
            <span className="admin-role-label">Nivel de Acceso: Master Lab</span>
          </div>
        </div>
      </div>
    </header>
  )
}

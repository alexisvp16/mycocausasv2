import React from 'react'
import { Link } from 'react-router-dom'
import logoImg from '../../assets/logo.png'
import { useAuth } from '../../context/useAuth'

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) {
  const { logout } = useAuth()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: '📦',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeType: 'warning',
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: '🍄',
    },
    {
      id: 'inventario',
      label: 'Inventario & Lotes',
      icon: '🏭',
      badge: lowStockCount > 0 ? `${lowStockCount} bajo` : null,
      badgeType: 'danger',
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: '👥',
    },
    {
      id: 'cupones',
      label: 'Cupones & Descuentos',
      icon: '🏷️',
    },
    {
      id: 'reportes',
      label: 'Reportes & Finanzas',
      icon: '📈',
    },
  ]

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="admin-sidebar-brand">
        <div className="brand-logo-container">
          <img src={logoImg} alt="Myco Causas Logo" className="brand-logo-img" />
        </div>
        <div className="admin-brand-texts">
          <strong>MYCO CAUSAS</strong>
          <span className="admin-badge-role">PANEL DE CONTROL // LAB</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="admin-nav-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-nav-button ${
              activeTab === item.id ? 'active' : ''
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge && (
              <span className={`admin-badge-pill ${item.badgeType || 'info'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="admin-sidebar-footer">
        <Link to="/" className="btn-sidebar-store" target="_blank" rel="noreferrer">
          <span>🏪 Ver Tienda Pública</span>
          <span>↗</span>
        </Link>
        <button
          type="button"
          className="btn-sidebar-logout"
          onClick={() => logout()}
        >
          🔒 Cerrar Sesión Admin
        </button>
      </div>
    </aside>
  )
}

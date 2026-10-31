import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import logoImg from '../../assets/logo.png'
import { useCart } from '../../context/useCart'
import { useAuth } from '../../context/useAuth'

export default function Navbar() {
  const { totalCartCount, setIsCartOpen } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="bio-navbar">
      <Link to="/" className="bio-brand" onClick={closeMenu}>
        <div className="brand-logo-container">
          <img src={logoImg} alt="Myco Causas Logo" className="brand-logo-img" />
        </div>
        <div className="brand-texts">
          <span className="brand-title">
            MYCO<span className="accent">CAUSAS</span>
          </span>
          <span className="brand-sub">BIOTECH LAB // FUNGI</span>
        </div>
      </Link>

      <nav className={`bio-nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          end
          onClick={closeMenu}
        >
          <span className="nav-num">01</span> Inicio
        </NavLink>
        <NavLink
          to="/productos"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          <span className="nav-num">02</span> Productos
        </NavLink>
        <NavLink
          to="/quienes-somos"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          <span className="nav-num">03</span> Quiénes somos
        </NavLink>
        <NavLink
          to="/contacto"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          <span className="nav-num">04</span> Contáctanos
        </NavLink>

        {/* Acceso de usuario dentro del menú desplegable móvil */}
        <div className="mobile-auth-links">
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin" className="nav-auth-btn admin-glow" onClick={closeMenu}>
              <span className="auth-icon">⚡</span>
              <span className="auth-text">Panel Admin</span>
            </Link>
          )}

          {isAuthenticated ? (
            <Link to="/cuenta" className="nav-auth-btn user-active" onClick={closeMenu}>
              <span className="auth-icon">🧬</span>
              <span className="auth-user-name">
                {user?.name?.split(' ')[0] || 'Mi Cuenta'}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="nav-auth-btn" onClick={closeMenu}>
              <span className="auth-icon">🔒</span>
              <span className="auth-text">Ingresar</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="nav-actions">
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin" className="nav-auth-btn admin-glow desktop-only" title="Panel Administrativo del Laboratorio">
            <span className="auth-icon">⚡</span>
            <span className="auth-text">Panel Admin</span>
          </Link>
        )}

        {isAuthenticated ? (
          <Link to="/cuenta" className="nav-auth-btn user-active desktop-only" title="Ver mi cuenta">
            <span className="auth-icon">🧬</span>
            <span className="auth-user-name">
              {user?.name?.split(' ')[0] || 'Mi Cuenta'}
            </span>
          </Link>
        ) : (
          <Link to="/login" className="nav-auth-btn desktop-only" title="Iniciar sesión seguro">
            <span className="auth-icon">🔒</span>
            <span className="auth-text">Ingresar</span>
          </Link>
        )}

        <button
          type="button"
          className="cart-trigger-btn"
          onClick={() => { setIsCartOpen(true); closeMenu() }}
          aria-label="Abrir carrito de compras"
        >
          <span className="cart-icon-dot">⬡</span>
          <span className="cart-label">ORDEN</span>
          <span className="cart-badge">{totalCartCount}</span>
        </button>

        <button
          type="button"
          className="bio-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar navegación móvil' : 'Abrir navegación móvil'}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  )
}

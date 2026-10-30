import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { API_BASE_URL } from '../services/apiConfig'

export default function AccountPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [errorOrders, setErrorOrders] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      setErrorOrders('')

      const storedSession = sessionStorage.getItem('myco_auth_session')
      const parsedToken = storedSession ? JSON.parse(storedSession)?.token : null
      const authToken = token || parsedToken

      const headers = {}
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const res = await fetch(`${API_BASE_URL}/pedidos`, {
        headers,
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setOrders(json.data || [])
      } else {
        setErrorOrders(json.message || 'No se pudieron recuperar los pedidos.')
      }
    } catch (err) {
      console.error('Error al cargar pedidos del usuario:', err)
      setErrorOrders('Error de conexión al cargar el historial de pedidos.')
    } finally {
      setLoadingOrders(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getStatusClass = (status) => {
    if (!status) return 'pendiente'
    const s = status.toLowerCase().trim()
    if (s.includes('preparaci')) return 'en-preparación'
    if (s.includes('enviad')) return 'enviado'
    if (s.includes('entregad')) return 'entregado'
    return 'pendiente'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Fecha no disponible'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="account-page-wrapper">
      <div className="account-container">
        {/* Profile Header */}
        <div className="account-header-card">
          <div className="account-avatar-box">
            <span className="account-avatar-glyph">🧬</span>
          </div>
          <div className="account-header-info">
            <div className="role-tag-row">
              <span className="user-role-badge">
                ROL: {user?.role === 'admin' ? 'ADMINISTRADOR LAB' : 'CLIENTE VERIFICADO'}
              </span>
              <span className="session-secure-pill">● SESIÓN ACTIVA SEGURA</span>
            </div>
            <h1 className="account-user-name">{user?.name}</h1>
            <p className="account-user-email">{user?.email}</p>
          </div>
          <button
            type="button"
            className="btn-account-logout"
            onClick={handleLogout}
          >
            Cerrar Sesión ↗
          </button>
        </div>

        {/* Sección de Historial de Pedidos & Tracking */}
        <div className="account-orders-wrapper">
          <div className="account-orders-card">
            <div className="account-orders-header">
              <div className="account-orders-title">
                <span style={{ fontSize: '20px' }}>📦</span>
                <h2>Mis Pedidos & Compras Realizadas</h2>
                <span className="orders-count-badge">
                  {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}
                </span>
              </div>
              <button
                type="button"
                className="btn-refresh-orders"
                onClick={fetchOrders}
                disabled={loadingOrders}
                title="Actualizar estado de órdenes"
              >
                ↻ {loadingOrders ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            {loadingOrders ? (
              <div className="account-orders-loading">
                <span className="text-neon">⚡ Consultando registros de pedidos en la red Myco...</span>
              </div>
            ) : errorOrders ? (
              <div className="account-orders-empty">
                <span className="empty-icon">⚠️</span>
                <h3>Atención al consultar pedidos</h3>
                <p>{errorOrders}</p>
                <button type="button" className="btn-bio-secondary" onClick={fetchOrders}>
                  Reintentar ↻
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="account-orders-empty">
                <span className="empty-icon">📦</span>
                <h3>Aún no has registrado pedidos con esta cuenta</h3>
                <p>
                  Cuando realices una compra de nuestras fórmulas biotecnológicas, aquí
                  podrás ver el detalle de tus productos y consultar el tracking en vivo en sus 4 estados.
                </p>
                <Link to="/productos" className="btn-bio-primary">
                  Explorar Catálogo de Fórmulas ↗
                </Link>
              </div>
            ) : (
              <div className="account-orders-list">
                {orders.map((ord) => {
                  const statusClass = getStatusClass(ord.estado)
                  return (
                    <div key={ord.id || ord.numero_orden} className="account-order-item">
                      <div className="order-item-head">
                        <div className="order-item-meta">
                          <span className="order-code-badge">{ord.numero_orden}</span>
                          <span className="order-date-label">📅 {formatDate(ord.fecha_pedido)}</span>
                        </div>
                        <span className={`status-pill ${statusClass}`}>
                          ● {ord.estado || 'Pendiente'}
                        </span>
                      </div>

                      <div className="order-item-body">
                        <div className="order-info-block">
                          <span className="info-label">Fórmulas & Artículos Adquiridos</span>
                          <span className="info-val">
                            {ord.resumen_productos || `${ord.total_items || 1} producto(s) en la orden`}
                          </span>

                          <span className="info-label" style={{ marginTop: '8px' }}>
                            Dirección de Envío
                          </span>
                          <span className="info-val">
                            📍 {ord.direccion_envio}
                            {ord.ciudad ? `, ${ord.ciudad}` : ''}
                            {ord.departamento ? ` - ${ord.departamento}` : ''}
                          </span>
                        </div>

                        <div className="order-info-block">
                          <span className="info-label">Método y Estado de Pago</span>
                          <span className="info-val">
                            💳 {ord.metodo_pago || 'Pago digital'} 
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                              ({ord.estado_pago || 'Pendiente'})
                            </span>
                          </span>

                          <span className="info-label" style={{ marginTop: '8px' }}>
                            Total de la Orden
                          </span>
                          <div className="order-price-highlight">
                            S/ {Number(ord.total).toFixed(2)}
                          </div>
                          {Number(ord.descuento) > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>
                              Cupón aplicado: -S/ {Number(ord.descuento).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="order-item-foot">
                        <div className="order-tracking-info">
                          {ord.guia_tracking ? (
                            <span>🚚 Guía Courier: <strong>{ord.guia_tracking}</strong></span>
                          ) : (
                            <span>🛰️ Trazabilidad de laboratorio activa en tiempo real</span>
                          )}
                        </div>

                        <Link
                          to={`/tracking/${encodeURIComponent(ord.numero_orden)}`}
                          className="btn-tracking-link"
                        >
                          🛰️ Ver Tracking en Vivo (4 Estados) ↗
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Grid */}
        <div className="account-grid">
          <div className="account-card">
            <div className="card-top-header">
              <span className="card-icon">🔐</span>
              <h3>Parámetros de Seguridad de la Sesión</h3>
            </div>
            <div className="telemetry-list">
              <div className="telemetry-item">
                <span className="t-label">ESTADO DE ENCRIPTACIÓN:</span>
                <span className="t-val text-neon">ACTIVA // TLS 1.3 // 256-BIT</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">ÚLTIMO ACCESO REGISTRADO:</span>
                <span className="t-val">{user?.lastLogin || 'Reciente'}</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">NIVEL DE PRIVACIDAD:</span>
                <span className="t-val">Datos disociados (Conforme Ley 29733)</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">AUTO LOGOUT POR INACTIVIDAD:</span>
                <span className="t-val text-neon">30 minutos</span>
              </div>
            </div>
          </div>

          <div className="account-card">
            <div className="card-top-header">
              <span className="card-icon">🍄</span>
              <h3>Acceso a Lotes & Trazabilidad</h3>
            </div>
            <div className="telemetry-list">
              <div className="telemetry-item">
                <span className="t-label">LOTES ASIGNADOS:</span>
                <span className="t-val text-neon">
                  {user?.batchAccess === 'ALL'
                    ? 'TODOS LOS LOTES (Acceso Total de Administrador)'
                    : 'MYCO-LION-26B / CERTIFICADOS ACTIVOS'}
                </span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">CERTIFICADOS COA:</span>
                <span className="t-val">Descarga autorizada en PDF</span>
              </div>
              <div className="telemetry-item">
                <span className="t-label">CONSULTA DIRECTA:</span>
                <span className="t-val">Canal prioritario con biólogos</span>
              </div>
            </div>
            <div className="card-actions-row">
              <Link to="/productos" className="btn-bio-primary">
                Ver Catálogo de Fórmulas ↗
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="btn-bio-secondary admin-btn-glow">
                  ⚡ Ingresar al Panel Administrativo ↗
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

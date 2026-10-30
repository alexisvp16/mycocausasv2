import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatImageUrl } from '../utils/imageUrl'
import { API_BASE_URL } from '../services/apiConfig'

export default function OrderTrackingPage() {
  const { orderCode } = useParams()
  const [searchInput, setSearchInput] = useState(orderCode || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const fetchTrackingData = async (code) => {
    if (!code) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/pedidos/tracking/${encodeURIComponent(code)}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se encontró información del pedido.')
      }

      setOrder(json.data)
      setError('')
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'No se pudo cargar el tracking del pedido.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  // Carga inicial
  useEffect(() => {
    if (orderCode) {
      fetchTrackingData(orderCode)
    } else {
      setLoading(false)
    }
  }, [orderCode])

  // Polling en vivo cada 6 segundos para capturar cambios de estado hechos por el Admin
  useEffect(() => {
    const activeCode = orderCode || order?.numero_orden
    if (!activeCode) return

    const timer = setInterval(() => {
      fetchTrackingData(activeCode)
    }, 6000)

    return () => clearInterval(timer)
  }, [orderCode, order?.numero_orden])

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setLoading(true)
    fetchTrackingData(searchInput.trim())
  }

  const estados = [
    {
      key: 'Pendiente',
      num: 1,
      title: 'Pedido Recibido',
      desc: 'Verificación de datos y confirmación de pago',
      icon: '📝',
    },
    {
      key: 'En Preparación',
      num: 2,
      title: 'En Preparación',
      desc: 'Formulación y empaque en laboratorio',
      icon: '🔬',
    },
    {
      key: 'Enviado',
      num: 3,
      title: 'En Camino',
      desc: 'Despachado con courier y en ruta de entrega',
      icon: '🚚',
    },
    {
      key: 'Entregado',
      num: 4,
      title: 'Entregado',
      desc: 'Paquete recibido satisfactoriamente',
      icon: '✅',
    },
  ]

  const getStepIndex = (status) => {
    if (status === 'Pendiente') return 1
    if (status === 'En Preparación') return 2
    if (status === 'Enviado') return 3
    if (status === 'Entregado') return 4
    return 1
  }

  const currentStep = order ? getStepIndex(order.estado) : 1

  return (
    <div className="order-tracking-page" style={{ maxWidth: '1240px', margin: '0 auto', padding: '3.5rem 5% 6rem' }}>
      {/* Header Banner */}
      <div className="tracking-header-banner" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="section-subtitle">[ TELEMETRÍA LOGÍSTICA & SEGUIMIENTO EN VIVO ]</span>
        <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: '0.6rem 0' }}>
          Tracking de <span className="text-bio-glow">tu Pedido.</span>
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Monitorea el progreso de tus formulaciones miceliales en tiempo real a través de las 4 etapas de preparación y despacho.
        </p>

        {/* Buscador de código si no vino en URL */}
        <form onSubmit={handleManualSearch} style={{ display: 'inline-flex', gap: '8px', marginTop: '1.5rem', maxWidth: '440px', width: '100%' }}>
          <input
            type="text"
            placeholder="Ingresa tu número de orden (Ej: ORD-2026-001)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(5, 10, 8, 0.8)',
              border: '1px solid var(--border-bio)',
              borderRadius: '6px',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
            }}
          />
          <button type="submit" className="btn-bio-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <span className="pulse-indicator" style={{ display: 'inline-block', width: '20px', height: '20px', marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff' }}>Consultando telemetría del pedido...</h3>
          <p style={{ color: '#9ca3af' }}>Sincronizando con el servidor de Myco Causas</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderColor: '#ef4444' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ color: '#f87171', marginBottom: '0.5rem' }}>No se encontró el pedido</h3>
          <p style={{ color: '#9ca3af', maxWidth: '520px', margin: '0 auto 1.5rem' }}>{error}</p>
          <Link to="/productos" className="btn-bio-primary">
            Volver a la Tienda ↗
          </Link>
        </div>
      ) : order ? (
        <div className="tracking-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Card Principal: Stepper de los 4 Estados */}
          <div
            className="admin-panel-card highlight"
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '16px',
              boxShadow: '0 0 35px rgba(0, 245, 160, 0.12)',
            }}
          >
            {/* Cabecera del Pedido */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '2.5rem',
              }}
            >
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--neon-emerald)', letterSpacing: '0.15em' }}>
                  // ORDEN OFICIAL MYCO CAUSAS
                </span>
                <h2 style={{ color: '#fff', fontSize: '1.8rem', margin: '0.25rem 0' }}>
                  {order.numero_orden}
                </h2>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                  Registrado el {new Date(order.fecha_pedido).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {lastUpdated && (
                    <span style={{ marginLeft: '12px', color: 'var(--neon-emerald)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      ● Sincronizado: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    background:
                      order.estado === 'Entregado'
                        ? 'rgba(0, 245, 160, 0.2)'
                        : order.estado === 'Enviado'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : order.estado === 'En Preparación'
                        ? 'rgba(168, 85, 247, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      order.estado === 'Entregado'
                        ? 'var(--neon-emerald)'
                        : order.estado === 'Enviado'
                        ? '#60a5fa'
                        : order.estado === 'En Preparación'
                        ? '#c084fc'
                        : '#fbbf24',
                    border: '1px solid currentColor',
                  }}
                >
                  <span className="pulse-indicator" style={{ width: '8px', height: '8px' }} />
                  {order.estado.toUpperCase()}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                  Actualizado en vivo hace unos segundos
                </span>
              </div>
            </div>

            {/* Stepper Visual de 4 Estados */}
            <div className="stepper-horizontal-container" style={{ position: 'relative', margin: '1rem 0 2rem' }}>
              <div
                className="stepper-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {estados.map((step) => {
                  const isCompleted = step.num < currentStep
                  const isCurrent = step.num === currentStep
                  const isPending = step.num > currentStep

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        opacity: isPending ? 0.45 : 1,
                        transition: 'all 0.3s',
                      }}
                    >
                      {/* Círculo indicador */}
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '1.25rem',
                          marginBottom: '1rem',
                          background: isCompleted
                            ? 'var(--neon-emerald)'
                            : isCurrent
                            ? 'rgba(0, 245, 160, 0.2)'
                            : 'rgba(15, 25, 20, 0.8)',
                          color: isCompleted ? '#060908' : isCurrent ? 'var(--neon-emerald)' : '#9ca3af',
                          border: isCurrent
                            ? '2px solid var(--neon-emerald)'
                            : isCompleted
                            ? '2px solid var(--neon-emerald)'
                            : '2px solid var(--border-subtle)',
                          boxShadow: isCurrent ? '0 0 25px rgba(0, 245, 160, 0.5)' : 'none',
                          fontWeight: 700,
                        }}
                      >
                        {isCompleted ? '✓' : step.icon}
                      </div>

                      <strong
                        style={{
                          fontSize: '0.95rem',
                          color: isCurrent ? 'var(--neon-emerald)' : '#fff',
                          marginBottom: '4px',
                        }}
                      >
                        {step.title}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', maxWidth: '180px', lineHeight: 1.4 }}>
                        {step.desc}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Banner de Mensaje del Estado Actual */}
            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem 1.5rem',
                borderRadius: '8px',
                background: 'rgba(0, 245, 160, 0.05)',
                border: '1px solid rgba(0, 245, 160, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>
                {order.estado === 'Pendiente' && '⏳'}
                {order.estado === 'En Preparación' && '⚗️'}
                {order.estado === 'Enviado' && '🚚'}
                {order.estado === 'Entregado' && '🎉'}
              </span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                  {order.estado === 'Pendiente' && 'Estamos validando tu pago y alistando la orden'}
                  {order.estado === 'En Preparación' && 'Tus fórmulas están siendo formuladas y empacadas en el laboratorio'}
                  {order.estado === 'Enviado' && 'Tu paquete está en camino con el servicio courier'}
                  {order.estado === 'Entregado' && '¡Tu pedido ha sido entregado exitosamente!'}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  {order.guia_tracking ? (
                    <>
                      Número de Guía / Courier:{' '}
                      <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>
                        {order.guia_tracking}
                      </strong>
                    </>
                  ) : (
                    'Cualquier actualización de tu orden se reflejará aquí en vivo.'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de 2 Columnas con Detalles de la Orden */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Columna Izquierda: Artículos Comprados */}
            <div className="admin-panel-card" style={{ padding: '1.75rem' }}>
              <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Fórmulas en tu Pedido</h3>
                  <span className="panel-sub">Productos certificados adquiridos</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {order.items?.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <img
                      src={formatImageUrl(it.imagen)}
                      alt={it.nombre_producto}
                      style={{ width: '54px', height: '54px', borderRadius: '6px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.opacity = '0.5' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>
                        {it.nombre_producto}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>
                        LOTE: {it.codigo_lote || 'MYCO-CERT-2026'}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af' }}>
                        {it.cantidad} unidad(es) • S/ {Number(it.precio_unitario).toFixed(2)} c/u
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      S/ {Number(it.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desglose Económico */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                  <span>Subtotal:</span>
                  <span>S/ {Number(order.subtotal).toFixed(2)}</span>
                </div>

                {Number(order.descuento) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neon-emerald)' }}>
                    <span>Descuento Cupón {order.cupon_codigo ? `(${order.cupon_codigo})` : ''}:</span>
                    <span>- S/ {Number(order.descuento).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                  <span>Costo de Envío:</span>
                  <span>{Number(order.costo_envio) === 0 ? <strong style={{ color: 'var(--neon-emerald)' }}>Gratis</strong> : `S/ ${Number(order.costo_envio).toFixed(2)}`}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-bio)',
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: '#fff', fontSize: '1.05rem' }}>Total Abonado:</strong>
                  <span style={{ color: 'var(--neon-emerald)', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    S/ {Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Datos de Envío & Soporte */}
            <div className="admin-panel-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>Datos de Entrega & Contacto</h3>
                    <span className="panel-sub">Destino y método registrado</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Cliente Receptor</span>
                    <strong style={{ color: '#fff' }}>{order.nombre_cliente}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Teléfono / WhatsApp</span>
                    <strong style={{ color: '#fff' }}>{order.telefono_cliente}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Correo de Notificación</span>
                    <strong style={{ color: '#fff' }}>{order.email_cliente}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Dirección de Entrega</span>
                    <strong style={{ color: '#fff' }}>{order.direccion_envio}</strong>
                    <span style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem' }}>{order.ciudad}, {order.departamento}</span>
                    {order.referencia_direccion && (
                      <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>Ref: {order.referencia_direccion}</span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Método de Pago</span>
                    <span className="payment-badge">{order.metodo_pago}</span>
                    <span style={{ marginLeft: '8px', color: '#9ca3af', fontSize: '0.8rem' }}>
                      Estado del pago: <strong>{order.estado_pago || 'Pendiente'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2rem' }}>
                <a
                  href={`https://wa.me/51937189745?text=Hola%20Myco%20Causas,%20deseo%20consultar%20sobre%20mi%20pedido%20${encodeURIComponent(order.numero_orden)}%20a%20nombre%20de%20${encodeURIComponent(order.nombre_cliente)}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-bio-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    padding: '12px',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>💬 Consultar este Pedido por WhatsApp</span>
                  <span>↗</span>
                </a>

                <Link
                  to="/productos"
                  className="btn-bio-secondary"
                  style={{ textAlign: 'center', textDecoration: 'none', padding: '10px', fontSize: '0.85rem' }}
                >
                  ← Explorar Más Productos
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useAuth } from '../context/useAuth'
import { formatImageUrl } from '../utils/imageUrl'
import { authService } from '../services/authService'
import { adminService } from '../services/adminService'
import { API_BASE_URL } from '../services/apiConfig'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const {
    cart,
    totalCartPrice,
    discountAmount,
    finalPrice,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart()

  const [formData, setFormData] = useState(() => ({
    nombre_cliente: user?.name || '',
    email_cliente: user?.email || '',
    telefono_cliente: user?.phone || '',
    departamento: 'Lima',
    ciudad: 'Lima Metropolitana',
    direccion_envio: '',
    referencia_direccion: '',
    metodo_pago: 'Yape',
    notas_cliente: '',
  }))

  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Sincronizar datos si el usuario inicia sesión durante el checkout
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => {
        if (prev.nombre_cliente && prev.email_cliente) return prev
        return {
          ...prev,
          nombre_cliente: prev.nombre_cliente || user.name || '',
          email_cliente: prev.email_cliente || user.email || '',
          telefono_cliente: prev.telefono_cliente || user.phone || '',
        }
      })
    }
  }, [isAuthenticated, user])

  // Cálculo de envío: Gratis en Lima a partir de S/ 150, sino S/ 10
  const shippingCost = finalPrice >= 150 ? 0 : 10
  const orderTotal = Math.max(0, finalPrice + shippingCost)

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setCouponError('')
    setIsValidatingCoupon(true)
    try {
      const data = await adminService.validateCoupon(couponCode, totalCartPrice)
      applyCoupon(data)
      setCouponCode('')
    } catch (err) {
      setCouponError(err.message || 'Cupón inválido o expirado.')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (cart.length === 0) {
      setErrorMessage('Tu carrito está vacío. Agrega productos para continuar.')
      return
    }

    if (
      !formData.nombre_cliente.trim() ||
      !formData.email_cliente.trim() ||
      !formData.telefono_cliente.trim() ||
      !formData.direccion_envio.trim()
    ) {
      setErrorMessage('Por favor completa todos los campos de contacto y dirección de entrega obligatorios.')
      return
    }

    // Validación rigurosa de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email_cliente.trim())) {
      setErrorMessage('Por favor ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).')
      return
    }

    // Validación de número de teléfono / WhatsApp (al menos 9 dígitos numéricos)
    const cleanPhone = formData.telefono_cliente.trim().replace(/[\s-]/g, '')
    if (cleanPhone.length < 9) {
      setErrorMessage('Por favor ingresa un número de teléfono / WhatsApp válido (mínimo 9 dígitos).')
      return
    }

    setIsSubmitting(true)

    try {
      const activeSession = authService.getStoredSession()
      const authToken = activeSession?.token || localStorage.getItem('myco_token') || sessionStorage.getItem('myco_token')
      const headers = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const payload = {
        nombre_cliente: formData.nombre_cliente.trim(),
        email_cliente: formData.email_cliente.trim(),
        telefono_cliente: formData.telefono_cliente.trim(),
        departamento: formData.departamento.trim(),
        ciudad: formData.ciudad.trim(),
        direccion_envio: formData.direccion_envio.trim(),
        referencia_direccion: formData.referencia_direccion.trim() || null,
        metodo_pago: formData.metodo_pago,
        subtotal: totalCartPrice,
        descuento: discountAmount,
        cupon_codigo: appliedCoupon ? appliedCoupon.codigo : null,
        costo_envio: shippingCost,
        notas_cliente: formData.notas_cliente.trim() || null,
        items: cart.map((i) => ({
          producto_id: i.id,
          cantidad: i.quantity,
        })),
      }

      const res = await fetch(`${API_BASE_URL}/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo registrar la orden.')
      }

      // Limpiar carrito y cupón
      clearCart()
      removeCoupon()

      // Redirigir a la pantalla de tracking de la orden con sus 4 estados
      navigate(`/tracking/${data.numero_orden}`)
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar el pedido. Intenta nuevamente.')
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty-container" style={{ padding: '6rem 1rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
        <h2 style={{ color: '#fff', marginBottom: '0.75rem' }}>Tu Carrito está Vacío</h2>
        <p style={{ color: '#9ca3af', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          No tienes formulaciones seleccionadas actualmente para procesar el pago. Explora nuestro catálogo y añade extractos miceliales.
        </p>
        <Link to="/productos" className="btn-bio-primary">
          Explorar Catálogo de Productos →
        </Link>
      </div>
    )
  }

  return (
    <div className="checkout-page-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 5% 5rem' }}>
      {/* Header Banner */}
      <div className="checkout-header-banner" style={{ marginBottom: '2.5rem' }}>
        <span className="section-subtitle">[ CHECKOUT // PASARELA DE COMPRA SEGURA ]</span>
        <h1 style={{ fontSize: '2.2rem', color: '#fff', margin: '0.5rem 0' }}>
          Finalizar tu <span className="text-bio-glow">Orden Micelial.</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
          Completa tus datos de entrega y selecciona tu método de pago preferido para emitir tu orden con seguimiento en tiempo real.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            color: '#fca5a5',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div
          className="checkout-grid-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Columna Izquierda: Datos del Cliente & Envío */}
          <div className="checkout-form-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Banner de Estado de Usuario */}
            <div
              className="glass-card"
              style={{
                padding: '1.25rem 1.5rem',
                border: isAuthenticated ? '1px solid var(--border-bio)' : '1px solid var(--border-subtle)',
                background: isAuthenticated ? 'rgba(0, 245, 160, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
              }}
            >
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🧑‍🔬</span>
                  <div>
                    <strong style={{ color: 'var(--neon-emerald)', fontSize: '0.95rem', display: 'block' }}>
                      Sesión activa: {user?.name || 'Cliente Myco'}
                    </strong>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Hemos cargado tu información registrada para tu conveniencia.
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>
                      ¿Ya tienes una cuenta registrada?
                    </strong>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Inicia sesión para cargar tus direcciones guardadas.
                    </span>
                  </div>
                  <Link
                    to="/login"
                    className="btn-bio-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Iniciar Sesión ↗
                  </Link>
                </div>
              )}
            </div>

            {/* Bloque 1: Datos de Contacto */}
            <div className="admin-panel-card" style={{ padding: '1.75rem' }}>
              <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>1. Datos de Contacto & Facturación</h3>
                  <span className="panel-sub">Te enviaremos la confirmación y guía de entrega</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field">
                  <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                    Nombres y Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Alexis Vela Quiñones"
                    value={formData.nombre_cliente}
                    onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(5, 10, 8, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tu-correo@ejemplo.com"
                      value={formData.email_cliente}
                      onChange={(e) => setFormData({ ...formData, email_cliente: e.target.value })}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(5, 10, 8, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                      Teléfono Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+51 937 189 745"
                      value={formData.telefono_cliente}
                      onChange={(e) => setFormData({ ...formData, telefono_cliente: e.target.value })}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(5, 10, 8, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 2: Dirección de Envío */}
            <div className="admin-panel-card" style={{ padding: '1.75rem' }}>
              <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>2. Destino & Dirección de Entrega</h3>
                  <span className="panel-sub">Despacho seguro directo a tu puerta</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                      Departamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(5, 10, 8, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                      Ciudad / Distrito *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Miraflores, San Isidro, Surco..."
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(5, 10, 8, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                    Dirección Exacta (Calle, Avenida, Número, Dpto / Interior) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Benavides 1230 Dpto 402"
                    value={formData.direccion_envio}
                    onChange={(e) => setFormData({ ...formData, direccion_envio: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(5, 10, 8, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div className="form-field">
                  <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                    Referencia de Entrega (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: A media cuadra del parque, frente al banco"
                    value={formData.referencia_direccion}
                    onChange={(e) => setFormData({ ...formData, referencia_direccion: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(5, 10, 8, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div className="form-field">
                  <label style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '4px' }}>
                    Notas especiales o instrucciones para el repartidor (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Dejar en recepción o llamar al llegar..."
                    value={formData.notas_cliente}
                    onChange={(e) => setFormData({ ...formData, notas_cliente: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(5, 10, 8, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      resize: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bloque 3: Método de Pago */}
            <div className="admin-panel-card" style={{ padding: '1.75rem' }}>
              <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>3. Método de Pago</h3>
                  <span className="panel-sub">Selecciona cómo deseas realizar tu abono</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {['Yape', 'Plin', 'Transferencia BCP', 'Transferencia Interbank', 'Tarjeta'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, metodo_pago: method })}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '8px',
                      border: formData.metodo_pago === method ? '1px solid var(--neon-emerald)' : '1px solid var(--border-subtle)',
                      background: formData.metodo_pago === method ? 'rgba(0, 245, 160, 0.12)' : 'rgba(10, 18, 14, 0.6)',
                      color: formData.metodo_pago === method ? 'var(--neon-emerald)' : '#d1d5db',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Caja de Instrucciones del Método de Pago Seleccionado */}
              <div
                style={{
                  background: 'rgba(0, 245, 160, 0.05)',
                  border: '1px solid rgba(0, 245, 160, 0.2)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}
              >
                {formData.metodo_pago === 'Yape' && (
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>📱 Pago mediante Yape:</strong>
                    <span>Número Yape: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>937 189 745</strong></span><br />
                    <span>Titular: <strong>Alexis Vela // Myco Causas Lab</strong></span><br />
                    <span style={{ color: '#9ca3af' }}>Al generar la orden, tu pedido quedará en estado <em>Pendiente</em> mientras se verifica tu captura de pantalla o abono.</span>
                  </div>
                )}

                {formData.metodo_pago === 'Plin' && (
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>⚡ Pago mediante Plin:</strong>
                    <span>Número Plin: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>937 189 745</strong> (Interbank / BBVA / Scotiabank)</span><br />
                    <span>Titular: <strong>Alexis Vela // Myco Causas</strong></span>
                  </div>
                )}

                {formData.metodo_pago === 'Transferencia BCP' && (
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>🏦 Banco de Crédito del Perú (BCP):</strong>
                    <span>Cuenta Corriente Soles: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>191-98765432-0-12</strong></span><br />
                    <span>CCI: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>00219100987654320128</strong></span><br />
                    <span>Razón Social: <strong>MYCO CAUSAS S.A.C.</strong></span>
                  </div>
                )}

                {formData.metodo_pago === 'Transferencia Interbank' && (
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>🏦 Interbank:</strong>
                    <span>Cuenta Soles: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>200-3001234567</strong></span><br />
                    <span>CCI: <strong style={{ color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>00320000300123456745</strong></span>
                  </div>
                )}

                {formData.metodo_pago === 'Tarjeta' && (
                  <div>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>💳 Pago con Tarjeta de Débito / Crédito:</strong>
                    <span>Aceptamos Visa, Mastercard, American Express y Diners. La orden se generará y podrás coordinar el link de pago o pos contraentrega.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen de la Orden & Descuento */}
          <div className="checkout-summary-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
            <div className="admin-panel-card highlight" style={{ padding: '1.75rem' }}>
              <div className="panel-card-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>Resumen de tu Orden ({cart.length})</h3>
                  <span className="panel-sub">Formulaciones certificadas de laboratorio</span>
                </div>
              </div>

              {/* Lista de Ítems */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <img
                      src={formatImageUrl(item.image)}
                      alt={item.name}
                      style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.opacity = '0.5' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {item.quantity} x {item.price}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      S/ {(Number(item.priceValue || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caja de Cupón de Descuento */}
              <div style={{ marginBottom: '1.5rem', padding: '12px', background: 'rgba(0, 245, 160, 0.04)', borderRadius: '8px', border: '1px solid rgba(0, 245, 160, 0.15)' }}>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--neon-emerald)', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ✓ {appliedCoupon.codigo}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
                        {appliedCoupon.tipo_descuento === 'porcentaje' ? `${appliedCoupon.valor_descuento}% de descuento` : `S/ ${appliedCoupon.valor_descuento} de descuento`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
                      ¿Tienes un código de descuento?
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Ej: MYCO10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          background: 'rgba(5, 10, 8, 0.8)',
                          border: '1px solid var(--border-bio)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--neon-emerald)',
                          color: '#060908',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {isValidatingCoupon ? '...' : 'Canjear'}
                      </button>
                    </div>
                    {couponError && (
                      <span style={{ color: '#f87171', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                        {couponError}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Desglose de Totales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                  <span>Subtotal</span>
                  <span>S/ {totalCartPrice.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neon-emerald)' }}>
                    <span>Descuento ({appliedCoupon.codigo})</span>
                    <span>- S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                  <span>Costo de Envío</span>
                  <span>{shippingCost === 0 ? <strong style={{ color: 'var(--neon-emerald)' }}>Gratis (Lima)</strong> : `S/ ${shippingCost.toFixed(2)}`}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-bio)',
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>TOTAL A PAGAR</strong>
                  <span style={{ color: 'var(--neon-emerald)', fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    S/ {orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-bio-primary"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <span>⏳ Registrando tu pedido en base de datos...</span>
                ) : (
                  <>
                    <span>Confirmar Pedido & Ir al Tracking</span>
                    <span>↗</span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                🔒 Transacción Cifrada • Certificado de Pureza HPLC Garantizado
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

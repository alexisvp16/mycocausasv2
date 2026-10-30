import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { formatImageUrl } from '../../utils/imageUrl'
import { adminService } from '../../services/adminService'

export default function CartDrawer() {
  const navigate = useNavigate()
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    totalCartPrice,
    discountAmount,
    finalPrice,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    totalCartCount,
    sendWhatsAppOrder,
  } = useCart()

  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setCouponError('')
    setIsValidating(true)
    try {
      const data = await adminService.validateCoupon(couponCode, totalCartPrice)
      applyCoupon(data)
      setCouponCode('')
    } catch (err) {
      setCouponError(err.message || 'Cupón inválido o expirado.')
    } finally {
      setIsValidating(false)
    }
  }

  if (!isCartOpen) return null

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-header">
          <div className="drawer-title-box">
            <span className="drawer-icon">⬡</span>
            <h3>ORDEN DE FÓRMULAS ({totalCartCount})</h3>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsCartOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <span className="empty-icon">⁕</span>
              <p>Tu orden de formulaciones está vacía.</p>
              <Link
                to="/productos"
                className="btn-bio-primary"
                onClick={() => setIsCartOpen(false)}
              >
                Explorar Productos
              </Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div className="cart-item-row" key={item.id}>
                  <img
                    src={formatImageUrl(item.image)}
                    alt={item.name}
                    className="item-thumb"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0.5'
                    }}
                  />
                  <div className="item-info">
                    <span className="item-botanical">{item.botanical}</span>
                    <h4 className="item-name">{item.name}</h4>
                    <span className="item-price-unit">{item.price}</span>
                    <div className="item-qty-controls">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="qty-btn"
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="qty-btn"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="item-subtotal">
                    S/ {(Number(item.priceValue || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            {/* Canje de Cupón en el Carrito */}
            <div className="cart-coupon-box" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0, 245, 160, 0.05)', borderRadius: '6px', border: '1px solid rgba(0, 245, 160, 0.15)' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--neon-emerald)', fontSize: '1rem' }}>✓</span>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>
                        {appliedCoupon.codigo}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>
                        Descuento aplicado: {appliedCoupon.tipo_descuento === 'porcentaje' ? `${appliedCoupon.valor_descuento}%` : `S/ ${appliedCoupon.valor_descuento}`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Código de descuento..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: 'rgba(5, 10, 8, 0.8)',
                      border: '1px solid var(--border-bio)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isValidating}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--neon-emerald)',
                      color: '#060908',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isValidating ? '...' : 'Aplicar'}
                  </button>
                </form>
              )}
              {couponError && (
                <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.4rem', marginBottom: 0 }}>
                  {couponError}
                </p>
              )}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>S/ {totalCartPrice.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div className="summary-row" style={{ color: 'var(--neon-emerald)' }}>
                <span>Descuento ({appliedCoupon.codigo})</span>
                <span>- S/ {discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total-highlight">
              <span>TOTAL ESTIMADO</span>
              <span className="total-amount">
                S/ {finalPrice.toFixed(2)}
              </span>
            </div>
            <div className="shipping-notice">
              {finalPrice >= 150 ? (
                <span className="free-shipping">
                  ✓ Califica para Envío Gratis en Lima
                </span>
              ) : (
                <span>Envío calculado al confirmar por WhatsApp</span>
              )}
            </div>
            <button
              type="button"
              className="btn-bio-primary"
              style={{
                width: '100%',
                marginBottom: '0.75rem',
                padding: '14px',
                fontSize: '0.95rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsCartOpen(false)
                navigate('/checkout')
              }}
            >
              <span>💳 Proceder al Pago / Finalizar Compra</span>
              <span>↗</span>
            </button>
            <button
              type="button"
              className="btn-checkout-whatsapp"
              style={{
                background: 'transparent',
                border: '1px solid rgba(37, 211, 102, 0.4)',
                color: '#25d366',
              }}
              onClick={sendWhatsAppOrder}
            >
              O coordinar orden por WhatsApp ↗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { adminService } from '../../services/adminService'
import { useCart } from '../../context/useCart'

export default function TraceabilitySection() {
  const [couponCode, setCouponCode] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const { totalCartPrice, applyCoupon, setIsCartOpen } = useCart()

  const handleCouponRedeem = async (e) => {
    e.preventDefault()
    const clean = couponCode.trim().toUpperCase()
    if (!clean) return

    setLoading(true)
    setFeedback(null)

    try {
      const data = await adminService.validateCoupon(clean, totalCartPrice)
      applyCoupon(data)
      setFeedback({
        success: true,
        coupon: data,
        message: data.descripcion
          ? `Cupón válido: ${data.descripcion}`
          : 'Cupón activado correctamente para tu compra.',
      })
    } catch (err) {
      setFeedback({
        success: false,
        message: err.message || 'El cupón ingresado no existe, está inactivo o ha expirado.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bio-traceability-section" id="cupones">
      <div className="trace-card">
        <div className="trace-content">
          <span className="section-subtitle">
            [ PROGRAMA DE BENEFICIOS & PROMOCIONES ]
          </span>
          <h3 className="trace-title">Canjear Código de Descuento</h3>
          <p className="trace-desc">
            ¿Cuentas con un cupón promocional o código de descuento? Ingrésalo a continuación
            para validar tu beneficio y aplicarlo automáticamente a tu orden de compra.
          </p>

          <form className="trace-form" onSubmit={handleCouponRedeem}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Ej: MYCO10 o BIENVENIDA"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="trace-input"
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
              />
              <button type="submit" className="trace-submit-btn" disabled={loading}>
                {loading ? 'Validando...' : 'Canjear Cupón ↗'}
              </button>
            </div>
          </form>

          {feedback && (
            <div
              className="batch-result-box"
              style={{
                borderColor: feedback.success ? 'var(--neon-emerald)' : '#f87171',
                background: feedback.success ? 'rgba(0, 245, 160, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <div className="result-header">
                <span style={{ color: feedback.success ? 'var(--neon-emerald)' : '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                  {feedback.success ? '● ESTADO: CUPÓN ACTIVADO & VÁLIDO' : '✕ ESTADO: NO APLICABLE'}
                </span>
                {feedback.success && (
                  <span className="result-specimen" style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)' }}>
                    {feedback.coupon.codigo}
                  </span>
                )}
              </div>

              {feedback.success ? (
                <>
                  <div className="result-details" style={{ marginTop: '0.75rem' }}>
                    <div>
                      <strong>Beneficio:</strong>{' '}
                      {feedback.coupon.tipo_descuento === 'porcentaje'
                        ? `${feedback.coupon.valor_descuento}% de Descuento`
                        : `S/ ${Number(feedback.coupon.valor_descuento).toFixed(2)} de Descuento Fijo`}
                    </div>
                    {feedback.coupon.monto_minimo > 0 && (
                      <div>
                        <strong>Monto Mínimo:</strong> S/ {Number(feedback.coupon.monto_minimo).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <p className="result-note" style={{ color: '#d1d5db', marginTop: '0.5rem' }}>
                    {feedback.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="btn-bio-primary"
                    style={{
                      marginTop: '0.75rem',
                      fontSize: '0.8rem',
                      padding: '8px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    🛒 Abrir Mi Carrito con Descuento →
                  </button>
                </>
              ) : (
                <p className="result-note" style={{ color: '#f87171', marginTop: '0.5rem' }}>
                  {feedback.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="trace-badge-seal">
          <div className="seal-inner">
            <span className="seal-star">🎁</span>
            <span className="seal-lab">MYCO PROMO</span>
            <span className="seal-year">DESCUENTO</span>
            <span className="seal-sub">CANJE ACTIVO</span>
          </div>
        </div>
      </div>
    </section>
  )
}

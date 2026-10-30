import React, { useState } from 'react'
import { CartContext } from './cartContextDefinition'

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeModalProduct, setActiveModalProduct] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
    }, 3200)
  }

  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon)
    showToast(`✓ Cupón "${coupon.codigo}" aplicado a tu orden`)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    showToast('Cupón de descuento removido')
  }

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
    showToast(`+ Añadido a la orden: ${product.name}`)
  }

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const totalCartPrice = cart.reduce(
    (acc, item) => acc + item.priceValue * item.quantity,
    0
  )

  const discountAmount = appliedCoupon
    ? appliedCoupon.tipo_descuento === 'porcentaje'
      ? (totalCartPrice * Number(appliedCoupon.valor_descuento)) / 100
      : Math.min(totalCartPrice, Number(appliedCoupon.valor_descuento))
    : 0

  const finalPrice = Math.max(0, totalCartPrice - discountAmount)

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return
    const itemsList = cart
      .map(
        (i) =>
          `• ${i.name} (x${i.quantity}) - S/ ${(i.priceValue * i.quantity).toFixed(2)}`
      )
      .join('%0A')

    const couponDetail = appliedCoupon
      ? `%0A• Cupón aplicado: ${appliedCoupon.codigo} (-S/ ${discountAmount.toFixed(2)})%0A`
      : ''

    const totalText = `Total a Pagar: S/ ${finalPrice.toFixed(2)}`
    const subtotalText = appliedCoupon ? `Subtotal: S/ ${totalCartPrice.toFixed(2)}%0A` : ''

    const text = `¡Hola Myco Causas! Deseo solicitar el siguiente pedido de biotecnología fungi:%0A%0A${itemsList}%0A%0A${subtotalText}${couponDetail}${totalText}%0A%0A¿Me confirman disponibilidad y datos de envío?`
    window.open(`https://wa.me/51937189745?text=${text}`, '_blank')
  }

  const value = {
    cart,
    isCartOpen,
    setIsCartOpen,
    activeModalProduct,
    setActiveModalProduct,
    toastMessage,
    showToast,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCartPrice,
    discountAmount,
    finalPrice,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    totalCartCount,
    sendWhatsAppOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

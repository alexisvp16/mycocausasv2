import React from 'react'
import { useCart } from '../../context/useCart'

export default function Toast() {
  const { toastMessage } = useCart()

  if (!toastMessage) return null

  return (
    <div className="bio-toast">
      <span className="toast-pulse" />
      <span>{toastMessage}</span>
    </div>
  )
}

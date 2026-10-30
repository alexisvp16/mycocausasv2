import React from 'react'
import { useCart } from '../../context/useCart'
import { formatImageUrl } from '../../utils/imageUrl'

export default function ProductCard({ item }) {
  const { addToCart, setActiveModalProduct } = useCart()

  return (
    <article className="specimen-card">
      <div className="card-top-bar">
        <span className="card-code">SPECIMEN #{item.number}</span>
        {(item.tag || item.category) && (
          <span className="card-badge">{item.tag || item.category}</span>
        )}
      </div>

      <div
        className="card-media-box"
        onClick={() => setActiveModalProduct(item)}
        role="button"
        tabIndex={0}
      >
        <img
          src={formatImageUrl(item.image)}
          alt={item.name}
          className="card-img"
          onError={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
        />
        <span className="inspect-pill">VER FICHA TÉCNICA ↗</span>
      </div>

      <div className="card-body">
        <span className="botanical-name">{item.botanical}</span>
        <h3 className="specimen-name">{item.name}</h3>
        <p className="specimen-benefit">{item.category}</p>

        <div className="card-bioactives-box">
          <span className="bioactives-label">COMPUESTOS ACTIVOS:</span>
          <span className="bioactives-text">{item.bioactives}</span>
        </div>

        <div className="card-price-action">
          <div className="price-tag">
            <span className="curr">PE</span>
            <span className="val">{item.price}</span>
          </div>
          <div className="action-buttons">
            <button
              type="button"
              className="btn-add-cart"
              onClick={() => addToCart(item)}
            >
              + Añadir
            </button>
            <button
              type="button"
              className="btn-details-icon"
              onClick={() => setActiveModalProduct(item)}
              title="Ver análisis de laboratorio"
              aria-label="Ver análisis de laboratorio"
            >
              ℹ
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

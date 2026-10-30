import React from 'react'
import { useCart } from '../../context/useCart'
import { formatImageUrl } from '../../utils/imageUrl'

export default function ProductModal() {
  const { activeModalProduct, setActiveModalProduct, addToCart } = useCart()

  if (!activeModalProduct) return null

  // Extracción segura de datos con respaldos para evitar pantallas negras o errores de renderizado
  const name = activeModalProduct.name || activeModalProduct.nombre || 'Extracto Fúngico Estandarizado'
  const botanical = activeModalProduct.botanical || activeModalProduct.nombre_cientifico || 'Fórmula Biotecnológica'
  const image = formatImageUrl(activeModalProduct.image || activeModalProduct.imagen)
  const concentration = activeModalProduct.concentration || activeModalProduct.concentracion || '10:1 DUAL EXTRACT'
  const extractionMethod =
    activeModalProduct.extraction ||
    activeModalProduct.metodo_extraccion ||
    'Doble extracción hidroalcohólica ultrasónica'
  const price = activeModalProduct.price || (activeModalProduct.priceValue ? `S/ ${Number(activeModalProduct.priceValue).toFixed(2)}` : 'S/ 0.00')

  const description =
    activeModalProduct.description ||
    activeModalProduct.descripcion ||
    `Fórmula adaptogénica de alta concentración basada en extracto fúngico de ${name} (${botanical}). Producido bajo rigurosos estándares analíticos con doble extracción ultrasónica para máxima biodisponibilidad celular.`

  const bioactives =
    activeModalProduct.bioactives ||
    activeModalProduct.beneficios ||
    '1,3/1,6 Beta-Glucanos solubles, triterpenos funcionales y polisacáridos activos estandarizados.'

  const usage =
    activeModalProduct.usage ||
    activeModalProduct.dosis_recomendada ||
    'Consumir 1ml a 2ml diariamente (1 a 2 goteros) diluido en agua, café, infusión o directamente sublingual.'

  return (
    <div
      className="modal-backdrop"
      onClick={() => setActiveModalProduct(null)}
    >
      <div
        className="specimen-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close"
          onClick={() => setActiveModalProduct(null)}
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="modal-header">
          <span className="modal-badge">[ FICHA TÉCNICA DE LABORATORIO ]</span>
          <h3 className="modal-title">{name}</h3>
          <span className="modal-botanical">{botanical}</span>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-media">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.7'
                  }}
                />
              ) : (
                <div style={{ fontSize: '4rem', textAlign: 'center', padding: '3rem 0' }}>🍄</div>
              )}
            </div>

            <div className="modal-info">
              <div className="info-block">
                <h4>DESCRIPCIÓN BIO-FARMACOLÓGICA</h4>
                <p>{description}</p>
              </div>

              <div className="info-block">
                <h4>COMPUESTOS ACTIVOS PRINCIPALES</h4>
                <p className="highlight-text">{bioactives}</p>
              </div>

              <div className="info-block">
                <h4>PROTOCOLO DE CONSUMO RECOMENDADO</h4>
                <p>{usage}</p>
              </div>

              <div className="info-block">
                <h4>CONCENTRACIÓN / PRESENTACIÓN</h4>
                <p>{concentration}</p>
              </div>

              <div className="info-block">
                <h4>MÉTODO DE EXTRACCIÓN</h4>
                <p>{extractionMethod}</p>
              </div>

              <div className="modal-action-row">
                <span className="modal-price">{price}</span>
                <button
                  type="button"
                  className="btn-bio-primary"
                  onClick={() => {
                    addToCart(activeModalProduct)
                    setActiveModalProduct(null)
                  }}
                >
                  Añadir al Pedido ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

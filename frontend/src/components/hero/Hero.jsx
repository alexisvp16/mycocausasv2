import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { useCart } from '../../context/useCart'
import { formatImageUrl } from '../../utils/imageUrl'

export default function Hero() {
  const [activeHeroIdx, setActiveHeroIdx] = useState(0)
  const [products, setProducts] = useState(() => adminService.getProducts())
  const { addToCart, setActiveModalProduct } = useCart()

  useEffect(() => {
    adminService.fetchFromBackend().then((res) => {
      if (res && res.products && res.products.length > 0) {
        setProducts(res.products)
      } else {
        setProducts(adminService.getProducts())
      }
    })
  }, [])

  const hasProducts = products.length > 0
  const heroSpecimen = hasProducts ? products[Math.min(activeHeroIdx, products.length - 1)] : null

  return (
    <section className="bio-hero" id="inicio">
      <div className="hero-data-column">
        <div className="hero-status-tag">
          <span className="tag-bracket">[</span>
          <span className="pulse-indicator" />
          <span>ESTUDIO MICOLÓGICO CLÍNICO & BIOTECNOLOGÍA</span>
          <span className="tag-bracket">]</span>
        </div>

        <h1 className="hero-headline">
          La potencia biológica
          <br />
          del reino <span className="text-bio-glow">fungi.</span>
        </h1>

        <p className="hero-lead">
          Fórmulas bio-adaptogénicas de doble extracción hidroalcohólica ultrasónica.
          Diseñadas bajo rigurosos estándares analíticos para
          optimizar enfoque cognitivo, vitalidad celular y equilibrio nervioso sostenido.
        </p>

        {hasProducts ? (
          <>
            {/* Selector interactivo de productos reales cargados */}
            <div className="hero-specimen-selector">
              <div className="selector-label">FÓRMULAS ACTIVAS EN CATÁLOGO:</div>
              <div className="specimen-tabs">
                {products.map((spec, idx) => (
                  <button
                    key={spec.id}
                    type="button"
                    className={`specimen-tab-btn ${
                      activeHeroIdx === idx ? 'active' : ''
                    }`}
                    onClick={() => setActiveHeroIdx(idx)}
                  >
                    <span className="tab-idx">0{idx + 1}</span>
                    <span className="tab-name">{spec.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ficha técnica del producto seleccionado */}
            <div className="specimen-live-card">
              <div className="spec-card-header">
                <span className="spec-botanical">{heroSpecimen.botanical}</span>
                <span className="spec-batch">{heroSpecimen.batch}</span>
              </div>
              <div className="spec-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">CONCENTRACIÓN</span>
                  <span className="metric-value">{heroSpecimen.concentration}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">CATEGORÍA</span>
                  <span className="metric-value bio-accent">
                    {heroSpecimen.category}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">PRECIO</span>
                  <span className="metric-value">
                    {heroSpecimen.price}
                  </span>
                </div>
              </div>
              <div className="spec-cta-row">
                <button
                  type="button"
                  className="btn-bio-primary"
                  onClick={() => addToCart(heroSpecimen)}
                >
                  Añadir a la Orden • {heroSpecimen.price} <span>↗</span>
                </button>
                <button
                  type="button"
                  className="btn-bio-secondary"
                  onClick={() => setActiveModalProduct(heroSpecimen)}
                >
                  Ficha Técnica
                </button>
                <Link to="/productos" className="btn-bio-secondary">
                  Ver Catálogo Completo ↗
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Estado limpio y científico cuando aún no se han cargado productos */
          <div className="hero-clean-welcome">
            <div className="clean-pillars-grid">
              <div className="pillar-mini-card">
                <span className="pillar-icon">⚗️</span>
                <strong>Ultrasonido 28 kHz</strong>
                <p>Cavitación controlada para liberar compuestos intracelulares con máxima biodisponibilidad.</p>
              </div>
              <div className="pillar-mini-card">
                <span className="pillar-icon">🔬</span>
                <strong>Pureza HPLC & COA</strong>
                <p>Estandarización analítica garantizando alta pureza en beta-glucanos y terpenos activos.</p>
              </div>
              <div className="pillar-mini-card">
                <span className="pillar-icon">🌱</span>
                <strong>Fruto 100% Puro</strong>
                <p>Cultivos orgánicos certificados sin rellenos de almidón ni granos residuales.</p>
              </div>
            </div>

            <div className="hero-clean-actions">
              <Link to="/productos" className="btn-bio-primary">
                Explorar Catálogo <span>↗</span>
              </Link>
              <Link to="/quienes-somos" className="btn-bio-secondary">
                Conoce Nuestro Laboratorio
              </Link>
              <Link to="/contacto" className="btn-bio-secondary">
                Contáctanos
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Hero Visual Column */}
      <div className="hero-visual-column">
        <div className="hud-container">
          <div className="corner-decor top-left" />
          <div className="corner-decor top-right" />
          <div className="corner-decor bottom-left" />
          <div className="corner-decor bottom-right" />

          <div className="hud-header">
            <span className="hud-badge">
              {hasProducts ? `SPECIMEN #${heroSpecimen.number}` : 'PLATAFORMA BIOTECNOLÓGICA'}
            </span>
            <span className="hud-status">
              {hasProducts ? 'STATUS: PURIFIED_EXTRACT' : 'SISTEMA OPERATIVO // CONECTADO'}
            </span>
          </div>

          <div className="hud-image-wrapper">
            {hasProducts ? (
              <img
                src={formatImageUrl(heroSpecimen.image)}
                alt={heroSpecimen.name}
                className="hud-img"
              />
            ) : (
              <div className="hud-biotech-graphic">
                <div className="bio-ring outer-ring" />
                <div className="bio-ring middle-ring" />
                <div className="bio-core">
                  <span className="core-glyph">🍄</span>
                  <span className="core-caption">MYCO CAUSAS</span>
                </div>
              </div>
            )}
            <div className="hud-scanline" />
            <div className="hud-overlay-tags">
              <span className="overlay-pill">
                {hasProducts ? heroSpecimen.category : 'MICOLOGÍA FUNCIONAL'}
              </span>
              <span className="overlay-badge">
                {hasProducts ? `${heroSpecimen.concentration}` : 'CALIDAD CERTIFICADA'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

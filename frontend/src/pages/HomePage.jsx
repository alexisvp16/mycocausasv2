import React from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/hero/Hero'
import MetricsBar from '../components/science/MetricsBar'
import ProductCatalog from '../components/products/ProductCatalog'

export default function HomePage() {
  return (
    <div className="page-home">
      {/* Exclusivamente la Pantalla de Inicio */}
      <Hero />
      <MetricsBar />

      {/* Catálogo de Fórmulas y Extractos Activos */}
      <ProductCatalog
        title="Fórmulas y extractos disponibles"
        subtitle="[ CATÁLOGO DE PRODUCTOS ]"
      />

      {/* Portal de Acceso a los Demás Módulos */}
      <section className="home-modules-portal">
        <div className="portal-header">
          <span className="section-subtitle">[ NAVEGACIÓN DE MÓDULOS ]</span>
          <h2 className="portal-title">
            Explora el ecosistema <span className="text-bio-glow">Myco Causas.</span>
          </h2>
          <p className="portal-lead">
            Accede directamente a cada sección especializada de nuestro laboratorio.
          </p>
        </div>

        <div className="portal-cards-grid">
          <Link to="/productos" className="portal-card">
            <div className="portal-card-top">
              <span className="portal-num">01</span>
              <span className="portal-icon">📦</span>
            </div>
            <h3 className="portal-card-title">Catálogo de Productos</h3>
            <p className="portal-card-desc">
              Descubre nuestras formulaciones de Melena de León, Reishi, Cordyceps y Chaga con filtrado interactivo y fichas técnicas.
            </p>
            <span className="portal-link-action">
              Ver Productos <span>↗</span>
            </span>
          </Link>

          <Link to="/quienes-somos" className="portal-card">
            <div className="portal-card-top">
              <span className="portal-num">02</span>
              <span className="portal-icon">🔬</span>
            </div>
            <h3 className="portal-card-title">Quiénes Somos</h3>
            <p className="portal-card-desc">
              Conoce nuestra historia, al científico fungi insignia, la misión de Myco Causas y los 3 pilares de pureza micológica.
            </p>
            <span className="portal-link-action">
              Conocer Historia <span>↗</span>
            </span>
          </Link>

          <Link to="/contacto" className="portal-card">
            <div className="portal-card-top">
              <span className="portal-num">03</span>
              <span className="portal-icon">💬</span>
            </div>
            <h3 className="portal-card-title">Contáctanos</h3>
            <p className="portal-card-desc">
              Asesoría personalizada en vivo vía WhatsApp, atención a dudas sobre productos, envíos a nivel nacional y datos del laboratorio.
            </p>
            <span className="portal-link-action">
              Ir a Contacto <span>↗</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}

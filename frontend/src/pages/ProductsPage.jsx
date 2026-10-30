import React from 'react'
import ProductCatalog from '../components/products/ProductCatalog'
import MetricsBar from '../components/science/MetricsBar'
import TraceabilitySection from '../components/science/TraceabilitySection'

export default function ProductsPage() {
  return (
    <div className="page-products">
      <div className="page-header-banner">
        <span className="section-subtitle">[ CATÁLOGO COMPLETO ]</span>
        <h1 className="page-title">
          Fórmulas y extractos <span className="text-bio-glow">miceliales.</span>
        </h1>
        <p className="page-lead">
          Extractos triples de alta pureza certificados por cromatografía HPLC.
          Diseñados para integrar adaptógenos puros a tu estilo de vida.
        </p>
      </div>

      <ProductCatalog
        title="Todos los extractos disponibles"
        subtitle="[ FILTRAR POR CATEGORÍA ]"
      />

      <MetricsBar />
      <TraceabilitySection />
    </div>
  )
}

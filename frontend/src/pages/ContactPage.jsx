import React from 'react'
import ContactSection from '../components/contact/ContactSection'
import TraceabilitySection from '../components/science/TraceabilitySection'

export default function ContactPage() {
  return (
    <div className="page-contact">
      <div className="page-header-banner">
        <span className="section-subtitle">[ ATENCIÓN & ASESORÍA ]</span>
        <h1 className="page-title">
          Estamos aquí para <span className="text-bio-glow">asesorarte.</span>
        </h1>
        <p className="page-lead">
          Escríbenos directamente o visítanos en nuestros canales oficiales.
          Te ayudamos a elegir la fórmula perfecta para tu mente y cuerpo.
        </p>
      </div>

      <ContactSection />
      <TraceabilitySection />
    </div>
  )
}

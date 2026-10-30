import React from 'react'
import AboutSection from '../components/about/AboutSection'
import BiotechProcess from '../components/science/BiotechProcess'
import MetricsBar from '../components/science/MetricsBar'

export default function AboutPage() {
  return (
    <div className="page-about">
      <div className="page-header-banner">
        <span className="section-subtitle">[ CONOCE NUESTRA RAÍZ ]</span>
        <h1 className="page-title">
          La ciencia amigable del <span className="text-bio-glow">reino fungi.</span>
        </h1>
        <p className="page-lead">
          Nuestra misión es conectar a las personas con el poder biológico
          de los hongos funcionales mediante investigación transparente,
          cultivo consciente y honestidad científica.
        </p>
      </div>

      <AboutSection />
      <BiotechProcess />
      <MetricsBar />
    </div>
  )
}

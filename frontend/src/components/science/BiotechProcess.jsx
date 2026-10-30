import React from 'react'

export default function BiotechProcess() {
  return (
    <section className="bio-process-section">
      <div className="process-header">
        <span className="section-subtitle">[ INGENIERÍA MICELIAL ]</span>
        <h2 className="section-title">El protocolo de pureza celular</h2>
        <p className="process-lead">
          Los hongos poseen paredes celulares de quitina indigesta para el organismo humano.
          Nuestro proceso de 3 fases bioactivas garantiza que cada gota contenga
          los fitoquímicos en estado 100% asimilable.
        </p>
      </div>

      <div className="process-steps-grid">
        <div className="step-card">
          <div className="step-num">FASE 01</div>
          <h4 className="step-title">Biomasa Fúngica Seleccionada</h4>
          <p className="step-desc">
            Cultivo en sustrato de roble blanco y sustrato orgánico enriquecido. Cosechado
            exclusivamente en punto óptimo de esporulación.
          </p>
          <span className="step-tech-tag">Cuerpo Fructífero 100%</span>
        </div>

        <div className="step-card">
          <div className="step-num">FASE 02</div>
          <h4 className="step-title">Cavitación Ultrasónica 28 kHz</h4>
          <p className="step-desc">
            Ondas de alta frecuencia rompen la matriz de quitina sin degradar las
            hericenonas ni los polisacáridos termolábiles.
          </p>
          <span className="step-tech-tag">Ruptura Biomolecular</span>
        </div>

        <div className="step-card">
          <div className="step-num">FASE 03</div>
          <h4 className="step-title">Doble Extracción Hidroalcohólica</h4>
          <p className="step-desc">
            Disolución acuosa para beta-glucanos + alcohólica orgánica para triterpenos y
            ácidos ganodéricos. Concentración 10:1 en vacío.
          </p>
          <span className="step-tech-tag">Full Spectrum Bioactive</span>
        </div>
      </div>
    </section>
  )
}

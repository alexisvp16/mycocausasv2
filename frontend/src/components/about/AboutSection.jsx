import React from 'react'
import logoImg from '../../assets/logo.png'

export default function AboutSection() {
  return (
    <section className="bio-about-section" id="quienes-somos">
      <div className="about-container">
        <div className="about-visual-box">
          <div className="about-logo-frame">
            <img
              src={logoImg}
              alt="Científico Myco Causas"
              className="about-character-img"
            />
            <div className="about-glow-halo" />
            <div className="about-badge-label">
              <span>ESTUDIO FUNGI</span>
              <strong>MYCO CAUSAS</strong>
            </div>
          </div>
        </div>

        <div className="about-content-box">
          <span className="section-subtitle">[ IDENTIDAD & MISIÓN ]</span>
          <h2 className="section-title">
            Ciencia de laboratorio,{' '}
            <span className="text-bio-glow">cercana y natural.</span>
          </h2>

          <p className="about-lead">
            En <strong>Myco Causas</strong>, unimos la rigurosidad de la biotecnología micológica
            con la calidez y curiosidad por el reino fungi. Nacimos en Perú con la convicción de que
            la sabiduría ancestral de los hongos funcionales debe estar respaldada por ciencia real y accesible.
          </p>

          <p className="about-desc">
            ¿Por qué <em>"Causas"</em>? Porque entendemos el micelio como la red natural más poderosa del planeta:
            organismos que colaboran en simbiosis y comparten nutrientes. De la misma manera, somos una
            comunidad de amigos y apasionados por el bienestar que comparte conocimiento transparente,
            procesos limpios y productos libres de falsas promesas.
          </p>

          <div className="about-pillars-grid">
            <div className="about-pillar-card">
              <div className="pillar-icon">🔬</div>
              <h4>Rigor de Laboratorio</h4>
              <p>
                Estandarización precisa de beta-glucanos y pureza verificada con tecnología HPLC.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon">🌱</div>
              <h4>100% Cuerpos Fructíferos</h4>
              <p>
                Sin micelio en grano, sin rellenos de almidón ni avena. Concentración auténtica.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon">🤝</div>
              <h4>Comunidad & Asesoría</h4>
              <p>
                Acompañamiento personalizado para integrar los hongos funcionales a tu rutina diaria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import React from 'react'
import ContactForm from './ContactForm'

export default function ContactSection() {
  return (
    <section className="bio-contact-section" id="contacto">
      <div className="contact-container">
        <div className="contact-info-column">
          <span className="section-subtitle">[ COMUNICACIÓN DIRECTA ]</span>
          <h2 className="section-title">
            Hablemos de hongos <span className="text-bio-glow">funcionales.</span>
          </h2>
          <p className="contact-lead">
            ¿Tienes dudas sobre qué extracto elegir para tu rutina diaria? ¿Interesado en distribución
            o formulaciones especiales? Nuestro equipo micológico está listo para asesorarte.
          </p>

          <div className="contact-cards-grid">
            <a
              href="https://wa.me/51937189745"
              target="_blank"
              rel="noreferrer"
              className="contact-card whatsapp"
            >
              <div className="contact-card-icon">💬</div>
              <div>
                <h4>WhatsApp Oficial</h4>
                <p>Respuesta rápida y asesoría guiada</p>
                <span className="card-link-text">+51 937 189 745 ↗</span>
              </div>
            </a>

            <div className="contact-card">
              <div className="contact-card-icon">📍</div>
              <div>
                <h4>Laboratorio & Despachos</h4>
                <p>Lima, Perú · Envíos certificados a todo el país</p>
                <span className="card-link-text">Cobertura Nacional</span>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">✉️</div>
              <div>
                <h4>Correo Institucional</h4>
                <p>Consultas técnicas y colaboraciones</p>
                <span className="card-link-text">lab@mycocausas.pe</span>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">⏱️</div>
              <div>
                <h4>Horario de Atención</h4>
                <p>Lunes a Sábado: 9:00 AM - 7:00 PM</p>
                <span className="card-link-text">Horario GMT-5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-column">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

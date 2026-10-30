import React from 'react'
import { Link } from 'react-router-dom'
import logoImg from '../../assets/logo.png'

export default function Footer() {
  return (
    <footer className="bio-footer">
      <div className="footer-top">
        <div className="footer-brand-box">
          <div className="bio-brand">
            <div className="brand-logo-container">
              <img
                src={logoImg}
                alt="Myco Causas Logo"
                className="brand-logo-img footer-logo-img"
              />
            </div>
            <div className="brand-texts">
              <span className="brand-title">
                MYCO<span className="accent">CAUSAS</span>
              </span>
              <span className="brand-sub">BIOTECH LAB // PERÚ</span>
            </div>
          </div>
          <p className="footer-tagline">
            Biotecnología micológica aplicada a la salud humana.
            Investigación, formulación y cultivo de hongos funcionales
            de la más alta biodisponibilidad celular en Perú.
          </p>
        </div>

        <div className="footer-links-col">
          <span className="col-title">NAVEGACIÓN</span>
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/quienes-somos">Quiénes somos</Link>
          <Link to="/contacto">Contáctanos</Link>
        </div>

        <div className="footer-links-col">
          <span className="col-title">ATENCIÓN & LAB</span>
          <span className="contact-item">Lima, Perú</span>
          <span className="contact-item">lab@mycocausas.pe</span>
          <a
            href="https://wa.me/51937189745"
            target="_blank"
            rel="noreferrer"
            className="whatsapp-btn-footer"
          >
            WhatsApp (+51 937 189 745) ↗
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="copy">
          © 2026 MYCO CAUSAS // TODOS LOS DERECHOS RESERVADOS.
        </span>
        <span className="disclaimer">
          * Suplemento nutricional funcional. No reemplaza tratamientos médicos convencionales.
        </span>
      </div>
    </footer>
  )
}

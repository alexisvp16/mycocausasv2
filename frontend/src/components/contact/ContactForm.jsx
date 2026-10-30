import React, { useState } from 'react'
import { useCart } from '../../context/useCart'

export default function ContactForm() {
  const { showToast } = useCart()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    subject: 'Asesoría de Fórmulas',
    message: '',
  })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.message) {
      showToast('Por favor completa tu nombre y mensaje')
      return
    }

    const text = `¡Hola Myco Causas!%0A%0AMi nombre es: ${form.name}%0ATeléfono: ${
      form.phone || 'No especificado'
    }%0AAsunto: ${form.subject}%0A%0AMensaje:%0A${form.message}`

    window.open(`https://wa.me/51937189745?text=${text}`, '_blank')
    setSent(true)
    showToast('Abriendo WhatsApp con tu consulta...')
  }

  return (
    <div className="contact-form-card">
      <div className="form-card-header">
        <h3>Envíanos un Mensaje</h3>
        <span className="form-sub">
          Te responderemos directamente por WhatsApp o correo
        </span>
      </div>

      <form onSubmit={handleSubmit} className="interactive-contact-form">
        <div className="form-field">
          <label htmlFor="form-name">Tu Nombre</label>
          <input
            id="form-name"
            type="text"
            placeholder="Ej: Carlos Mendoza"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="form-phone">Número de WhatsApp</label>
          <input
            id="form-phone"
            type="tel"
            placeholder="Ej: +51 937 189 745"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="form-subject">Motivo de Consulta</label>
          <select
            id="form-subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          >
            <option value="Asesoría de Fórmulas">
              Asesoría para elegir mi hongo ideal
            </option>
            <option value="Consulta sobre Pedido">
              Consulta sobre disponibilidad o envío
            </option>
            <option value="Distribuidores y Mayoristas">
              Distribución y venta al por mayor
            </option>
            <option value="Información Científica">
              Información sobre estudios y COA
            </option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="form-message">Tu Consulta</label>
          <textarea
            id="form-message"
            rows={4}
            placeholder="Cuéntanos qué objetivo buscas (enfoque, sueño, energía, etc.)..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-send-contact">
          Enviar Consulta vía WhatsApp ↗
        </button>

        {sent && (
          <p className="contact-success-note">
            ✓ Hemos abierto WhatsApp con tu consulta pre-llenada. ¡En breve te atendemos!
          </p>
        )}
      </form>
    </div>
  )
}

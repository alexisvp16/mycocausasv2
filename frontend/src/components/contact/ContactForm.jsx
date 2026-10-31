import React, { useState } from 'react'
import { useCart } from '../../context/useCart'
import { API_BASE_URL } from '../../services/apiConfig'

export default function ContactForm() {
  const { showToast } = useCart()
  const [form, setForm] = useState({
    name: '',
    email: '',
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

    // Persistir consulta en base de datos MySQL de Myco Causas
    try {
      fetch(`${API_BASE_URL}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: form.name.trim(),
          email: form.email.trim() || 'consulta@mycocausas.pe',
          telefono: form.phone.trim() || null,
          asunto: form.subject,
          mensaje: form.message.trim(),
          tipo_consulta: form.subject,
        }),
      }).catch((err) => console.warn('Aviso: no se pudo sincronizar consulta en DB:', err))
    } catch (_) {}

    const text = `¡Hola Myco Causas!%0A%0AMi nombre es: ${encodeURIComponent(form.name)}%0ACorreo: ${encodeURIComponent(form.email || 'No especificado')}%0ATeléfono: ${encodeURIComponent(
      form.phone || 'No especificado'
    )}%0AAsunto: ${encodeURIComponent(form.subject)}%0A%0AMensaje:%0A${encodeURIComponent(form.message)}`

    window.open(`https://wa.me/51937189745?text=${text}`, '_blank')
    setSent(true)
    showToast('✓ Consulta registrada y abriendo WhatsApp oficial...')
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
          <label htmlFor="form-name">Tu Nombre Completo *</label>
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
          <label htmlFor="form-email">Correo Electrónico (Opcional)</label>
          <input
            id="form-email"
            type="email"
            placeholder="Ej: carlos@dominio.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="form-phone">Número de WhatsApp / Teléfono</label>
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

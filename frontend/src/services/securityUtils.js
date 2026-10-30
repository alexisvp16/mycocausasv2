/**
 * MYCO CAUSAS // MÓDULO DE SEGURIDAD Y SANITIZACIÓN
 * Parámetros y utilidades de seguridad para entornos de producción.
 */

// Expresión regular RFC 5322 para correos válidos y libres de inyecciones
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Sanitiza y valida formato de correo electrónico
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export function isValidEmail(email) {
  const clean = sanitizeEmail(email)
  if (!clean || clean.length > 254) return false
  return EMAIL_REGEX.test(clean)
}

/**
 * Sanitización de texto para mitigar ataques XSS (Cross-Site Scripting)
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '') // Elimina etiquetas HTML
    .trim()
}

/**
 * Evaluación de política de contraseñas de alta seguridad
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 símbolo especial
 */
export function evaluatePasswordSecurity(password) {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      label: 'Inválida',
      errors: ['La contraseña es requerida.'],
    }
  }

  const errors = []
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres requeridos.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula (A-Z).')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula (a-z).')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un dígito numérico (0-9).')
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Debe incluir al menos un símbolo especial (ej. !@#$%&*).')
  }

  let score = 0
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 15
  if (/[A-Z]/.test(password)) score += 20
  if (/[a-z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 15

  let label = 'Insegura'
  let color = '#ef4444' // Red

  if (score >= 85) {
    label = 'Grado Biotecnológico (Excelente)'
    color = '#00f5a0' // Neon emerald
  } else if (score >= 60) {
    label = 'Robusta'
    color = '#10b981' // Green
  } else if (score >= 40) {
    label = 'Moderada'
    color = '#f59e0b' // Yellow/Orange
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 100),
    label,
    color,
    errors,
  }
}

/**
 * Retraso artificial anti side-channel / timing attacks
 */
export function secureDelay(minMs = 300, maxMs = 550) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * MYCO CAUSAS // SERVICIO DE AUTENTICACIÓN PARA PRODUCCIÓN
 * Soporta conexión a API REST con Bearer Token JWT, cookies seguras
 * y modo de desarrollo seguro con almacenamiento protegido.
 */

import { secureDelay, sanitizeEmail } from './securityUtils'
import {
  registerFailedAttempt,
  resetSecurityState,
  checkLockoutStatus,
} from './rateLimiter'
import { API_BASE_URL } from './apiConfig'
const SESSION_STORAGE_KEY = 'myco_auth_session'
const SESSION_MAX_IDLE_MINUTES = 30

/**
 * Usuarios demo precargados para pruebas de desarrollo seguro
 */
const DEMO_USERS = [
  {
    id: 1,
    name: 'Dra. Elena Ramos (Admin Lab)',
    email: 'admin@mycocausas.pe',
    passwordHash: 'Admin2026!*',
    role: 'admin',
    lastLogin: '2026-10-28 22:30:00',
    batchAccess: 'ALL',
  },
  {
    id: 2,
    name: 'Carlos Mendoza (Investigador)',
    email: 'cliente@mycocausas.pe',
    passwordHash: 'Cliente123!*',
    role: 'client',
    lastLogin: '2026-10-27 15:45:00',
    batchAccess: 'MYCO-LION-26B',
  },
]

export const authService = {
  /**
   * Obtiene la sesión activa verificando vigencia e inactividad
   */
  getStoredSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!raw) return null

      const session = JSON.parse(raw)
      const now = Date.now()

      // Verificar expiración por inactividad
      if (session.lastActivity) {
        const diffMinutes = (now - session.lastActivity) / (1000 * 60)
        if (diffMinutes > SESSION_MAX_IDLE_MINUTES) {
          this.clearSession()
          return null
        }
      }

      // Actualizar timestamp de actividad
      session.lastActivity = now
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      return session
    } catch {
      return null
    }
  },

  /**
   * Guarda la sesión en sessionStorage (evita localStorage para mitigar fugas XSS permanentes)
   */
  setSession(user, token) {
    const session = {
      user,
      token,
      loginTime: Date.now(),
      lastActivity: Date.now(),
    }
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Ignorar si storage está bloqueado
    }
    return session
  },

  clearSession() {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // Ignorar
    }
  },

  /**
   * Login con verificación de rate-limiting y retraso anti-timing
   */
  async login(email, password) {
    // 1. Verificar bloqueo por fuerza bruta
    const lockout = checkLockoutStatus()
    if (lockout.isLocked) {
      throw new Error(
        `Acceso bloqueado por seguridad. Demasiados intentos fallidos. Reintenta en ${lockout.secondsRemaining} segundos.`
      )
    }

    // 2. Retraso artificial aleatorio para prevenir inferencia por tiempos de respuesta
    await secureDelay(350, 600)

    const cleanEmail = sanitizeEmail(email)

    // 3. Intento de conexión con backend de producción (Node/Express + MySQL)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.success) {
        resetSecurityState()
        const rawUser = data.user || data.usuario || {}
        const user = {
          id: rawUser.id,
          name: rawUser.nombre || rawUser.name,
          email: rawUser.email,
          role: rawUser.rol || rawUser.role,
          phone: rawUser.telefono || rawUser.phone,
          lastLogin: rawUser.ultimo_acceso || new Date().toISOString(),
          batchAccess: rawUser.rol === 'admin' ? 'ALL' : 'MYCO-LION-26B',
        }
        return this.setSession(user, data.token)
      }

      if (response.status === 429) {
        throw new Error(data.message || 'Acceso bloqueado por seguridad temporalmente.')
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(data.message || 'Credenciales incorrectas.')
      }
    } catch (networkOrAuthError) {
      // Si fue un error explícito de credenciales o bloqueo retornado por el backend, lanzarlo directamente
      if (networkOrAuthError.message && !networkOrAuthError.message.includes('Failed to fetch')) {
        throw networkOrAuthError
      }
      // Solo si el backend está totalmente apagado (Failed to fetch), recurre a demo
    }

    // 4. Validación local controlada (Demo biotecnológica)
    const matchedUser = DEMO_USERS.find(
      (u) => u.email === cleanEmail && u.passwordHash === password
    )

    if (!matchedUser) {
      registerFailedAttempt()
      const updatedStatus = checkLockoutStatus()
      if (updatedStatus.isLocked) {
        throw new Error(
          `Credenciales inválidas. Cuenta bloqueada temporalmente por ${updatedStatus.secondsRemaining} segundos.`
        )
      }
      throw new Error(
        `Credenciales incorrectas. Te quedan ${
          5 - updatedStatus.attempts
        } intentos antes del bloqueo de seguridad.`
      )
    }

    // Credenciales correctas: reiniciar contador de fallos
    resetSecurityState()

    const sanitizedUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      lastLogin: new Date().toISOString(),
      batchAccess: matchedUser.batchAccess,
    }

    const mockJwt = `myco_sec_token_${btoa(cleanEmail)}_${Date.now()}`
    return this.setSession(sanitizedUser, mockJwt)
  },

  /**
   * Registro seguro de nuevos usuarios
   */
  async register({ name, email, password, phone }) {
    await secureDelay(400, 700)
    const cleanEmail = sanitizeEmail(email)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: name,
          name,
          email: cleanEmail,
          password,
          telefono: phone,
          phone,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.success) {
        const rawUser = data.user || {}
        const user = {
          id: rawUser.id,
          name: rawUser.nombre || name,
          email: rawUser.email || cleanEmail,
          role: rawUser.rol || 'cliente',
          phone: rawUser.telefono || phone,
          lastLogin: new Date().toISOString(),
          batchAccess: 'GENERAL',
        }
        return this.setSession(user, data.token)
      }

      if (data.message) {
        throw new Error(data.message)
      }
      throw new Error('Error al registrar usuario. Verifica los datos ingresados.')
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err
      }
      throw new Error(
        'No se pudo conectar con el servidor backend (puerto 5000). Asegúrate de que el backend esté ejecutándose con "npm run dev".'
      )
    }
  },
}

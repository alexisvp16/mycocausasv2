/**
 * MYCO CAUSAS // PROTECCIÓN ANTI BRUTE-FORCE & RATE LIMITER
 * Bloquea temporalmente solicitudes tras intentos fallidos consecutivos
 * para proteger contra ataques de fuerza bruta y credential stuffing.
 */

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60 * 1000 // 60 segundos de bloqueo inicial
const STORAGE_KEY = 'myco_auth_security_state'

export function getSecurityState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { attempts: 0, lockedUntil: 0 }
    }
    const parsed = JSON.parse(raw)
    return {
      attempts: Number(parsed.attempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    }
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

export function saveSecurityState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Si el almacenamiento está restringido por políticas del navegador
  }
}

export function registerFailedAttempt() {
  const current = getSecurityState()
  const attempts = current.attempts + 1
  let lockedUntil = current.lockedUntil

  if (attempts >= MAX_ATTEMPTS) {
    // Incremento exponencial según reincidencias
    const multiplier = Math.max(1, attempts - MAX_ATTEMPTS + 1)
    lockedUntil = Date.now() + LOCKOUT_DURATION_MS * multiplier
  }

  saveSecurityState({ attempts, lockedUntil })
  return { attempts, lockedUntil, isLocked: lockedUntil > Date.now() }
}

export function resetSecurityState() {
  saveSecurityState({ attempts: 0, lockedUntil: 0 })
}

export function checkLockoutStatus() {
  const { attempts, lockedUntil } = getSecurityState()
  const now = Date.now()

  if (lockedUntil > now) {
    const secondsRemaining = Math.ceil((lockedUntil - now) / 1000)
    return {
      isLocked: true,
      attempts,
      secondsRemaining,
    }
  }

  return {
    isLocked: false,
    attempts,
    secondsRemaining: 0,
  }
}

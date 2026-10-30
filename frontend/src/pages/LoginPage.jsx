import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  isValidEmail,
  sanitizeEmail,
  sanitizeText,
  evaluatePasswordSecurity,
} from '../services/securityUtils'
import logoImg from '../assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, loading, error, setError, lockoutStatus } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Local client-side validation errors
  const [clientErrors, setClientErrors] = useState([])

  const from = location.state?.from?.pathname || '/cuenta'

  // Password evaluation in real-time
  const passwordSecurity = evaluatePasswordSecurity(regPassword)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setClientErrors([])
    setError('')

    const cleanEmail = sanitizeEmail(email)

    if (!cleanEmail) {
      setClientErrors(['Por favor ingresa tu correo electrónico.'])
      return
    }

    if (!isValidEmail(cleanEmail)) {
      setClientErrors(['El formato del correo electrónico no es válido.'])
      return
    }

    if (!password) {
      setClientErrors(['La contraseña es requerida.'])
      return
    }

    try {
      await login(cleanEmail, password)
      navigate(from, { replace: true })
    } catch {
      // Error is set in AuthContext
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setClientErrors([])
    setError('')

    const cleanName = sanitizeText(regName)
    const cleanEmail = sanitizeEmail(regEmail)
    const cleanPhone = sanitizeText(regPhone)

    const errors = []

    if (!cleanName || cleanName.length < 3) {
      errors.push('El nombre completo debe tener al menos 3 caracteres.')
    }

    if (!isValidEmail(cleanEmail)) {
      errors.push('El correo electrónico no tiene un formato válido.')
    }

    if (!passwordSecurity.isValid) {
      errors.push('La contraseña no cumple con los requisitos de seguridad.')
    }

    if (regPassword !== regConfirmPassword) {
      errors.push('Las contraseñas no coinciden.')
    }

    if (errors.length > 0) {
      setClientErrors(errors)
      return
    }

    try {
      await register({
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        phone: cleanPhone,
      })
      navigate('/cuenta', { replace: true })
    } catch {
      // Error handled by AuthContext
    }
  }

  const fillDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setClientErrors([])
    setError('')
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Card Header with Brand Logo */}
        <div className="login-card-header">
          <Link to="/" className="login-logo-link">
            <div className="brand-logo-container">
              <img src={logoImg} alt="Myco Causas Logo" className="brand-logo-img" />
            </div>
            <div className="brand-texts">
              <span className="brand-title">
                MYCO<span className="accent">CAUSAS</span>
              </span>
              <span className="brand-sub">PORTAL DE SEGURIDAD LAB</span>
            </div>
          </Link>
          <span className="security-status-badge">
            <span className="live-dot" /> SSL 256-BIT // ANTI BRUTE-FORCE
          </span>
        </div>

        {/* Tab switch between Login and Register */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setClientErrors([])
              setError('')
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`login-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register')
              setClientErrors([])
              setError('')
            }}
          >
            Crear Cuenta Segura
          </button>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutStatus.isLocked && (
          <div className="auth-lockout-banner">
            <span className="lockout-icon">⛔</span>
            <div>
              <strong>ACCESO TEMPORALMENTE BLOQUEADO</strong>
              <p>
                Demasiados intentos erróneos detectados. El protocolo de seguridad
                mantendrá el bloqueo durante:{' '}
                <span className="lockout-timer">
                  {lockoutStatus.secondsRemaining}s
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Error Feedback Banners */}
        {(error || clientErrors.length > 0) && (
          <div className="auth-error-banner">
            <span className="error-icon">⚠️</span>
            <div className="error-messages-list">
              {error && <p>{error}</p>}
              {clientErrors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          </div>
        )}

        {/* FORM: INICIAR SESIÓN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
            <div className="auth-input-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div className="input-with-icon">
                <span className="field-icon">✉</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="ejemplo@mycocausas.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading || lockoutStatus.isLocked}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="label-with-aside">
                <label htmlFor="login-password">Contraseña</label>
                <button
                  type="button"
                  className="link-forgot-pass"
                  onClick={() =>
                    alert(
                      'Protocolo de recuperación: En producción recibirás un token criptográfico de un solo uso (OTP) a tu correo.'
                    )
                  }
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="input-with-icon">
                <span className="field-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading || lockoutStatus.isLocked}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="auth-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading || lockoutStatus.isLocked}
            >
              {loading ? (
                <span className="submit-loading-text">
                  <span className="live-dot" /> Verificando encriptación...
                </span>
              ) : (
                'Ingresar al Portal ↗'
              )}
            </button>

            {/* Quick Demo Access Bar */}
            <div className="demo-credentials-box">
              <span className="demo-title">
                ⚡ Credenciales Demo de prueba rápida:
              </span>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  className="demo-btn admin"
                  onClick={() =>
                    fillDemoCredentials('admin@mycocausas.pe', 'Admin2026!*')
                  }
                >
                  Administradora Lab
                </button>
                <button
                  type="button"
                  className="demo-btn client"
                  onClick={() =>
                    fillDemoCredentials('cliente@mycocausas.pe', 'Cliente123!*')
                  }
                >
                  Cliente Investigador
                </button>
              </div>
            </div>
          </form>
        )}

        {/* FORM: REGISTRO DE CUENTA */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
            <div className="auth-input-group">
              <label htmlFor="reg-name">Nombre y Apellidos</label>
              <div className="input-with-icon">
                <span className="field-icon">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Ej: Valeria Torres"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-email">Correo Electrónico</label>
              <div className="input-with-icon">
                <span className="field-icon">✉</span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="valeria@correo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-phone">Teléfono / WhatsApp</label>
              <div className="input-with-icon">
                <span className="field-icon">📱</span>
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="+51 937 189 745"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-password">Contraseña Maestra</label>
              <div className="input-with-icon">
                <span className="field-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Ocultar' : 'Mostrar'}
                  tabIndex={-1}
                >
                  {showRegPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Password Security Meter */}
              {regPassword.length > 0 && (
                <div className="password-meter-box">
                  <div className="meter-bar-track">
                    <div
                      className="meter-bar-fill"
                      style={{
                        width: `${passwordSecurity.score}%`,
                        backgroundColor: passwordSecurity.color,
                      }}
                    />
                  </div>
                  <div className="meter-label-row">
                    <span>Nivel de Seguridad:</span>
                    <strong style={{ color: passwordSecurity.color }}>
                      {passwordSecurity.label}
                    </strong>
                  </div>

                  {/* Requirements checklist */}
                  <div className="requirements-checklist">
                    <span className={regPassword.length >= 8 ? 'met' : 'unmet'}>
                      {regPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                    </span>
                    <span className={/[A-Z]/.test(regPassword) ? 'met' : 'unmet'}>
                      {/[A-Z]/.test(regPassword) ? '✓' : '○'} Mayúscula (A-Z)
                    </span>
                    <span className={/[a-z]/.test(regPassword) ? 'met' : 'unmet'}>
                      {/[a-z]/.test(regPassword) ? '✓' : '○'} Minúscula (a-z)
                    </span>
                    <span className={/[0-9]/.test(regPassword) ? 'met' : 'unmet'}>
                      {/[0-9]/.test(regPassword) ? '✓' : '○'} Dígito numérico (0-9)
                    </span>
                    <span
                      className={
                        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword)
                          ? 'met'
                          : 'unmet'
                      }
                    >
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword)
                        ? '✓'
                        : '○'}{' '}
                      Símbolo especial (!@#$%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-confirm-password">Confirmar Contraseña</label>
              <div className="input-with-icon">
                <span className="field-icon">🔑</span>
                <input
                  id="reg-confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading || !passwordSecurity.isValid}
            >
              {loading ? (
                <span className="submit-loading-text">
                  <span className="live-dot" /> Registrando usuario...
                </span>
              ) : (
                'Crear Cuenta Biotecnológica ↗'
              )}
            </button>
          </form>
        )}

        {/* Security Parameters Footer */}
        <div className="login-security-footer">
          <div className="security-icon-row">
            <span>🛡️ Encriptación SHA-256</span>
            <span>⏱️ Time-Out por Inactividad (30 min)</span>
            <span>🚫 Anti Brute-Force Rate Limiter</span>
            <span>🔒 Sanitización XSS</span>
          </div>
          <p className="security-legal">
            Tus datos de salud y pedidos son confidenciales bajo la Ley N° 29733 de
            Protección de Datos Personales de Perú.
          </p>
        </div>
      </div>
    </div>
  )
}

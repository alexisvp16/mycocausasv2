import React, { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './authContextDefinition'
import { authService } from '../services/authService'
import { checkLockoutStatus } from '../services/rateLimiter'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => authService.getStoredSession()?.user || null
  )
  const [token, setToken] = useState(
    () => authService.getStoredSession()?.token || null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lockoutStatus, setLockoutStatus] = useState(() => checkLockoutStatus())

  const refreshLockoutStatus = useCallback(() => {
    const status = checkLockoutStatus()
    setLockoutStatus(status)
    return status
  }, [])

  // Temporizador para vigilar bloqueo por fuerza bruta y sesión inactiva
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLockoutStatus()
      // Verificar vigencia de sesión por inactividad
      const activeSession = authService.getStoredSession()
      if (!activeSession && user) {
        setUser(null)
        setToken(null)
        setError('Tu sesión ha expirado por inactividad. Por favor ingresa de nuevo.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [refreshLockoutStatus, user])

  const login = async (email, password) => {
    setError('')
    setLoading(true)
    try {
      const session = await authService.login(email, password)
      setUser(session.user)
      setToken(session.token)
      refreshLockoutStatus()
      return session.user
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.')
      refreshLockoutStatus()
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setError('')
    setLoading(true)
    try {
      const session = await authService.register(userData)
      setUser(session.user || userData)
      setToken(session.token || 'jwt_new_user')
      return session
    } catch (err) {
      setError(err.message || 'Error al registrar usuario.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.clearSession()
    setUser(null)
    setToken(null)
    setError('')
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    loading,
    error,
    setError,
    login,
    register,
    logout,
    lockoutStatus,
    refreshLockoutStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

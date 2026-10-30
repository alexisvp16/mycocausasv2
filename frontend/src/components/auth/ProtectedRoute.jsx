import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <span className="live-dot" />
        <p>Verificando credenciales de seguridad...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirige al login preservando la ruta previa
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Si no tiene el rol necesario (ej. admin)
    return <Navigate to="/" replace />
  }

  return children
}

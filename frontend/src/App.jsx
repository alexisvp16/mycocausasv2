import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import AnnouncementBar from './components/layout/AnnouncementBar'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CartDrawer from './components/cart/CartDrawer'
import ProductModal from './components/products/ProductModal'
import Toast from './components/common/Toast'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './App.css'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname, hash])

  return null
}

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={`biotech-app ${isAdminRoute ? 'admin-mode' : ''}`}>
      {/* Ambient bioluminescent visual layers */}
      <div className="ambient-radial glow-top-left" />
      <div className="ambient-radial glow-center-right" />
      <div className="ambient-grid-overlay" />

      {/* Persistent components only on storefront */}
      <Toast />
      {!isAdminRoute && <AnnouncementBar />}
      {!isAdminRoute && <Navbar />}

      {/* Dynamic route modules */}
      <main className={isAdminRoute ? 'admin-main-flow' : 'main-content-flow'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/tracking" element={<OrderTrackingPage />} />
          <Route path="/tracking/:orderCode" element={<OrderTrackingPage />} />
          <Route path="/pedido/:orderCode" element={<OrderTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cuenta"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          {/* Ruta protegida exclusiva para Administradores de Laboratorio */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
      <CartDrawer />
      <ProductModal />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

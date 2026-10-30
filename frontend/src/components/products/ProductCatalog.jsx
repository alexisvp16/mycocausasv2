import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/useAuth'
import ProductCard from './ProductCard'

export default function ProductCatalog({ title, subtitle }) {
  const [activeFilter, setActiveFilter] = useState('')
  const [products, setProducts] = useState(() => adminService.getProducts())
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    // Sincronizar catálogo con el backend / base de datos MySQL
    adminService.fetchFromBackend().then((res) => {
      if (res && res.products) {
        setProducts(res.products)
      } else {
        setProducts(adminService.getProducts())
      }
    })
  }, [])

  // Extraer únicamente las categorías reales existentes en los productos agregados
  const dynamicCategories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => {
      const cat = (p.category || p.categoria_nombre || '').trim()
      if (cat) {
        set.add(cat)
      }
    })
    return Array.from(set)
  }, [products])

  // Si solo hay 1 categoría, solo se muestra esa categoría (sin 'TODOS' ni opciones adicionales)
  // Si hay más de 1 categoría, se incluye 'TODOS' para permitir alternar
  const filterPills = useMemo(() => {
    if (dynamicCategories.length === 0) return []
    if (dynamicCategories.length === 1) return dynamicCategories
    return ['TODOS', ...dynamicCategories]
  }, [dynamicCategories])

  // Filtro activo efectivo derivado directamente sin renders en cascada
  const effectiveFilter = useMemo(() => {
    if (dynamicCategories.length === 0) return ''
    if (dynamicCategories.length === 1) return dynamicCategories[0]
    if (activeFilter && (activeFilter === 'TODOS' || dynamicCategories.includes(activeFilter))) {
      return activeFilter
    }
    return 'TODOS'
  }, [dynamicCategories, activeFilter])

  const filtered = useMemo(() => {
    if (!effectiveFilter || effectiveFilter === 'TODOS') {
      return products
    }
    const filterLower = effectiveFilter.trim().toLowerCase()
    return products.filter((s) => {
      const cat = (s.category || s.categoria_nombre || s.tag || '').trim().toLowerCase()
      return cat === filterLower || cat.includes(filterLower)
    })
  }, [products, effectiveFilter])

  const isAdmin = isAuthenticated && user?.role === 'admin'

  return (
    <section className="bio-collection" id="productos">
      <div className="collection-header">
        <div className="section-title-wrap">
          <span className="section-subtitle">
            {subtitle || '[ CATÁLOGO DE PRODUCTOS ]'}
          </span>
          <h2 className="section-title">
            {title ? (
              title
            ) : (
              <>
                Fórmulas y extractos{' '}
                <span className="text-bio-glow">funcionales.</span>
              </>
            )}
          </h2>
        </div>

        {/* Filter Pills dinámicas basadas únicamente en productos existentes */}
        {filterPills.length > 0 && (
          <div className="filter-pills">
            {filterPills.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-btn ${
                  effectiveFilter === category ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: '3.5rem 2rem', textAlign: 'center', margin: '2rem 0' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍄</div>
          <h3
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: '#f3f4f6',
              marginBottom: '0.75rem',
            }}
          >
            Próximamente: Nuevas Fórmulas & Extractos Funcionales
          </h3>
          <p
            style={{
              maxWidth: '560px',
              margin: '0 auto 1.75rem',
              color: '#9ca3af',
              lineHeight: 1.6,
            }}
          >
            Estamos finalizando el proceso de doble extracción ultrasónica y certificación
            HPLC de nuestros próximos lotes miceliales. Muy pronto podrás adquirirlos directamente
            desde esta sección.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/contacto"
              className="btn-bio-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <span>Contáctanos o Solicita Información</span>
              <span>→</span>
            </Link>
          </div>

          {/* Acceso visible ÚNICAMENTE para Administradores de la plataforma */}
          {isAdmin && (
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(0, 245, 160, 0.15)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--neon-emerald)',
                  marginBottom: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                [ MODO ADMINISTRADOR DETECTADO // SESIÓN AUTORIZADA ]
              </span>
              <Link
                to="/admin"
                className="btn-bio-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <span>⚡ Ir al Panel para Registrar Nuevos Productos</span>
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: '3rem 2rem', textAlign: 'center', margin: '2rem 0' }}
        >
          <p style={{ color: '#9ca3af' }}>
            No hay productos disponibles bajo la categoría seleccionada.
          </p>
        </div>
      ) : (
        <div className="specimens-grid">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

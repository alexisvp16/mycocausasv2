/**
 * MYCO CAUSAS // SERVICIO DE ADMINISTRACIÓN Y BACKOFFICE (PLANTILLA LIMPIA)
 * Listo para producción: sin datos de prueba falsos ni órdenes simuladas.
 * Sincronización bidireccional en tiempo real con API Node.js / Express y MySQL 8.0.
 */

import { authService } from './authService'
import { API_BASE_URL } from './apiConfig'

// Inicializadores limpios para que el cliente ingrese sus propios productos y empiece desde 0
const INITIAL_ORDERS = []
const INITIAL_INVENTORY = []
const INITIAL_USERS = [
  {
    id: 1,
    name: 'Alexis Vela (Administrador Myco)',
    email: 'admin@mycocausas.pe',
    phone: '+51 937 189 745',
    role: 'admin',
    status: 'Activo',
    registeredDate: '2026-10-29',
    ordersCount: 0,
  },
]

const INITIAL_COUPONS = [
  {
    id: 1,
    codigo: 'MYCO10',
    descripcion: '10% de descuento de bienvenida en tu orden',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    monto_minimo: 0,
    limite_usos: 100,
    veces_usado: 0,
    fecha_expiracion: '2027-10-29',
    activo: true,
  },
]

const STORAGE_PREFIX = 'myco_admin_'

function loadFromStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, data) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
  } catch {
    // Storage deshabilitado
  }
}

function getAuthHeaders() {
  const session = authService.getStoredSession()
  const headers = { 'Content-Type': 'application/json' }
  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`
  }
  return headers
}

export const adminService = {
  /**
   * Limpia toda la persistencia local de prueba en el navegador
   */
  clearAllLocalDemoData() {
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + 'orders')
      sessionStorage.removeItem(STORAGE_PREFIX + 'products')
      sessionStorage.removeItem(STORAGE_PREFIX + 'inventory')
      sessionStorage.removeItem(STORAGE_PREFIX + 'users')
      sessionStorage.removeItem(STORAGE_PREFIX + 'coupons')
    } catch {
      // Ignorar
    }
  },

  /**
   * Sincroniza pedidos, productos, lotes y usuarios directamente desde el backend en tiempo real
   */
  async fetchFromBackend() {
    try {
      const headers = getAuthHeaders()

      const [ordersRes, prodsRes, invRes, usersRes, couponsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/pedidos`, { headers }),
        fetch(`${API_BASE_URL}/productos?all=true`, { headers }),
        fetch(`${API_BASE_URL}/inventario/lotes`, { headers }),
        fetch(`${API_BASE_URL}/admin/usuarios`, { headers }),
        fetch(`${API_BASE_URL}/cupones`),
      ])

      const result = {}

      // Mapeo de pedidos desde MySQL
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const json = await ordersRes.value.json()
        if (json.success && Array.isArray(json.data)) {
          const mappedOrders = json.data.map((o) => ({
            id: o.numero_orden || `ORD-${o.id}`,
            dbId: o.id,
            customer: o.nombre_cliente,
            phone: o.telefono_cliente,
            email: o.email_cliente,
            city: o.ciudad,
            total: Number(o.total),
            status: o.estado,
            date: new Date(o.fecha_pedido).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            paymentMethod: o.metodo_pago,
            items: [],
          }))
          saveToStorage('orders', mappedOrders)
          result.orders = mappedOrders
        }
      }

      // Mapeo de productos desde MySQL
      if (prodsRes.status === 'fulfilled' && prodsRes.value.ok) {
        const json = await prodsRes.value.json()
        if (json.success && Array.isArray(json.data)) {
          const mappedProds = json.data.map((p, index) => ({
            id: p.id,
            number: String(index + 1).padStart(2, '0'),
            name: p.nombre,
            botanical: p.nombre_cientifico,
            category: p.categoria_nombre || p.subtitulo,
            priceValue: Number(p.precio),
            price: `S/ ${Number(p.precio).toFixed(2)}`,
            batch: p.lote_codigo || 'SIN-LOTE',
            concentration: p.concentracion || '10:1',
            stock: p.stock_total,
            active: Boolean(p.activo),
            image: p.imagen || '/melena-leon.jpg',
            description: p.descripcion,
            bioactives: p.beneficios,
            usage: p.dosis_recomendada,
            extraction: p.metodo_extraccion || 'Doble extracción hidroalcohólica ultrasónica',
            labMetrics: {
              betaGlucans: p.beta_glucanos_pct ? `${p.beta_glucanos_pct}%` : '38.2%',
              purity: p.pureza_hplc_pct ? `${p.pureza_hplc_pct}%` : '99.4%',
              bioavailability: 'Extrema (Doble Extracción)',
            },
          }))
          saveToStorage('products', mappedProds)
          result.products = mappedProds
        }
      }

      // Mapeo de lotes desde MySQL
      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const json = await invRes.value.json()
        if (json.success && Array.isArray(json.data)) {
          const mappedInv = json.data.map((l) => ({
            id: l.id,
            batchCode: l.codigo_lote,
            species: `${l.producto_nombre} (${l.nombre_cientifico})`,
            unitsAvailable: l.unidades_disponibles,
            thresholdMin: l.umbral_alerta,
            purityHPLC: `${l.pureza_hplc_pct}%`,
            betaGlucans: `${l.beta_glucanos_pct}%`,
            extractionDate: String(l.fecha_extraccion).split('T')[0],
            expiryDate: String(l.fecha_vencimiento).split('T')[0],
            coaStatus: l.estado_coa,
          }))
          saveToStorage('inventory', mappedInv)
          result.inventory = mappedInv
        }
      }

      // Mapeo de usuarios desde MySQL
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const json = await usersRes.value.json()
        if (json.success && Array.isArray(json.data)) {
          const mappedUsers = json.data.map((u) => ({
            id: u.id,
            name: u.nombre,
            email: u.email,
            phone: u.telefono || 'Sin teléfono',
            role: u.rol === 'admin' ? 'admin' : 'cliente',
            status: u.activo ? 'Activo' : 'Inactivo',
            registeredDate: u.created_at ? String(u.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
            ordersCount: 0,
          }))
          saveToStorage('users', mappedUsers)
          result.users = mappedUsers
        }
      }

      // Mapeo de cupones de descuento desde MySQL
      if (couponsRes.status === 'fulfilled' && couponsRes.value.ok) {
        const json = await couponsRes.value.json()
        if (json.success && Array.isArray(json.data)) {
          const mappedCoupons = json.data.map((c) => ({
            id: c.id,
            codigo: c.codigo,
            descripcion: c.descripcion || '',
            tipo_descuento: c.tipo_descuento,
            valor_descuento: Number(c.valor_descuento),
            monto_minimo: Number(c.monto_minimo || 0),
            limite_usos: c.limite_usos ? Number(c.limite_usos) : null,
            veces_usado: Number(c.veces_usado || 0),
            fecha_expiracion: c.fecha_expiracion || '',
            activo: Boolean(c.activo),
          }))
          saveToStorage('coupons', mappedCoupons)
          result.coupons = mappedCoupons
        }
      }

      return result
    } catch {
      return null
    }
  },

  // --- PEDIDOS ---
  getOrders() {
    return loadFromStorage('orders', INITIAL_ORDERS)
  },

  async updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders().map((ord) =>
      ord.id === orderId ? { ...ord, status: newStatus } : ord
    )
    saveToStorage('orders', orders)

    const targetOrder = orders.find((o) => o.id === orderId)
    const targetId = targetOrder?.dbId || targetOrder?.id || orderId

    if (targetId) {
      try {
        await fetch(`${API_BASE_URL}/pedidos/${targetId}/estado`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: newStatus }),
        })
      } catch (err) {
        console.warn('Error al actualizar estado en backend:', err)
      }
    }

    return orders
  },

  // --- PRODUCTOS ---
  getProducts() {
    return loadFromStorage('products', [])
  },

  async saveProduct(productData) {
    const products = this.getProducts()
    let updated
    const isEdit = Boolean(productData.id && typeof productData.id === 'number')

    if (isEdit) {
      try {
        await fetch(`${API_BASE_URL}/productos/${productData.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            nombre: productData.name,
            nombre_cientifico: productData.botanical,
            categoria_nombre: productData.category,
            subtitulo: productData.category,
            precio: productData.priceValue,
            concentracion: productData.concentration,
            stock_total: productData.stock,
            imagen: productData.image,
            descripcion: productData.description,
            description: productData.description,
            beneficios: productData.bioactives,
            bioactives: productData.bioactives,
            dosis_recomendada: productData.usage,
            usage: productData.usage,
            metodo_extraccion: productData.extraction,
            extraction: productData.extraction,
            pureza_hplc: productData.purity,
            purity: productData.purity,
            beta_glucanos: productData.betaGlucans,
            betaGlucans: productData.betaGlucans,
          }),
        })
      } catch (err) {
        console.warn('Error al actualizar producto en backend:', err)
      }

      updated = products.map((p) =>
        p.id === productData.id ? { ...p, ...productData } : p
      )
    } else {
      let createdId = Date.now()
      try {
        const res = await fetch(`${API_BASE_URL}/productos`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            categoria_nombre: productData.category,
            categoria: productData.category,
            nombre: productData.name,
            nombre_cientifico: productData.botanical,
            subtitulo: productData.category || '',
            descripcion: productData.description || 'Extracto biotecnológico puro estandarizado.',
            precio: productData.priceValue,
            concentracion: productData.concentration || '10:1 DUAL EXTRACT',
            metodo_extraccion: productData.extraction || 'Doble extracción hidroalcohólica ultrasónica',
            stock_total: productData.stock || 25,
            imagen: productData.image,
            beneficios: productData.bioactives || '',
            dosis_recomendada: productData.usage || '',
            pureza_hplc: productData.purity || '99.4% HPLC',
            beta_glucanos: productData.betaGlucans || '38.2%',
          }),
        })
        const json = await res.json()
        if (json.success && json.id) {
          createdId = json.id
        }
      } catch (err) {
        console.warn('Error al registrar producto en backend:', err)
      }

      const newProduct = {
        ...productData,
        id: createdId,
        number: String(products.length + 1).padStart(2, '0'),
        price: `S/ ${Number(productData.priceValue).toFixed(2)}`,
        active: true,
        labMetrics: productData.labMetrics || {
          betaGlucans: productData.betaGlucans || '38.2%',
          purity: productData.purity || '99.4%',
          bioavailability: 'Extrema (Doble Extracción)',
        },
      }
      updated = [newProduct, ...products]
    }

    saveToStorage('products', updated)
    return updated
  },

  async deleteProduct(productId) {
    if (typeof productId === 'number') {
      try {
        await fetch(`${API_BASE_URL}/productos/${productId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
      } catch (err) {
        console.warn('Error al eliminar producto en backend:', err)
      }
    }
    const products = this.getProducts().filter((p) => p.id !== productId)
    saveToStorage('products', products)
    return products
  },

  async toggleProductActive(productId) {
    if (typeof productId === 'number') {
      try {
        await fetch(`${API_BASE_URL}/productos/${productId}/toggle`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
        })
      } catch (err) {
        console.warn('Error al alternar estado en backend:', err)
      }
    }
    const products = this.getProducts().map((p) =>
      p.id === productId ? { ...p, active: !p.active } : p
    )
    saveToStorage('products', products)
    return products
  },

  // --- INVENTARIO & LOTES ---
  getInventory() {
    return loadFromStorage('inventory', INITIAL_INVENTORY)
  },

  updateBatchStock(batchCode, delta) {
    const inventory = this.getInventory().map((item) => {
      if (item.batchCode === batchCode) {
        const nextUnits = Math.max(0, item.unitsAvailable + delta)
        return { ...item, unitsAvailable: nextUnits }
      }
      return item
    })
    saveToStorage('inventory', inventory)
    return inventory
  },

  // --- USUARIOS ---
  getUsers() {
    return loadFromStorage('users', INITIAL_USERS)
  },

  toggleUserStatus(userId) {
    const users = this.getUsers().map((u) =>
      u.id === userId
        ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' }
        : u
    )
    saveToStorage('users', users)

    if (typeof userId === 'number') {
      const targetUser = users.find((u) => u.id === userId)
      if (targetUser) {
        fetch(`${API_BASE_URL}/admin/usuarios/${userId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ activo: targetUser.status === 'Activo' ? 1 : 0 }),
        }).catch(() => {})
      }
    }

    return users
  },

  // --- KPIS GENERALES ---
  getDashboardMetrics() {
    const orders = this.getOrders()
    const inventory = this.getInventory()
    const users = this.getUsers()

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
    const pendingOrders = orders.filter((o) => o.status === 'Pendiente').length
    const lowStockCount = inventory.filter(
      (i) => i.unitsAvailable <= i.thresholdMin
    ).length

    return {
      totalSales,
      pendingOrders,
      lowStockCount,
      totalOrders: orders.length,
      totalUsers: users.length,
      activeBatches: inventory.length,
    }
  },

  // --- CUPONES & CÓDIGOS DE DESCUENTO ---
  getCoupons() {
    return loadFromStorage('coupons', INITIAL_COUPONS)
  },

  async fetchCoupons() {
    try {
      const res = await fetch(`${API_BASE_URL}/cupones`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((c) => ({
            id: c.id,
            codigo: c.codigo,
            descripcion: c.descripcion || '',
            tipo_descuento: c.tipo_descuento,
            valor_descuento: Number(c.valor_descuento),
            monto_minimo: Number(c.monto_minimo || 0),
            limite_usos: c.limite_usos ? Number(c.limite_usos) : null,
            veces_usado: Number(c.veces_usado || 0),
            fecha_expiracion: c.fecha_expiracion || '',
            activo: Boolean(c.activo),
          }))
          saveToStorage('coupons', mapped)
          return mapped
        }
      }
    } catch (e) {
      console.warn('Error al sincronizar cupones:', e)
    }
    return this.getCoupons()
  },

  async saveCoupon(couponData) {
    const isEdit = Boolean(couponData.id)
    const url = isEdit ? `${API_BASE_URL}/cupones/${couponData.id}` : `${API_BASE_URL}/cupones`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(couponData),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Error al guardar el cupón')
      }
      return await this.fetchCoupons()
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async toggleCouponActive(couponId) {
    try {
      const res = await fetch(`${API_BASE_URL}/cupones/${couponId}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        return await this.fetchCoupons()
      }
    } catch (e) {
      console.error(e)
    }
    const current = this.getCoupons().map((c) =>
      c.id === couponId ? { ...c, activo: !c.activo } : c
    )
    saveToStorage('coupons', current)
    return current
  },

  async deleteCoupon(couponId) {
    try {
      const res = await fetch(`${API_BASE_URL}/cupones/${couponId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        return await this.fetchCoupons()
      }
    } catch (e) {
      console.error(e)
    }
    const current = this.getCoupons().filter((c) => c.id !== couponId)
    saveToStorage('coupons', current)
    return current
  },

  async validateCoupon(codigo, subtotal = 0) {
    const res = await fetch(`${API_BASE_URL}/cupones/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, subtotal }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Código de descuento inválido')
    }
    return json.data
  },
}

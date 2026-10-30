import React, { useState, useRef } from 'react'

export default function CouponsView({
  coupons = [],
  onSaveCoupon,
  onDeleteCoupon,
  onToggleActive,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')

  const formRef = useRef(null)

  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    monto_minimo: 0,
    limite_usos: '',
    fecha_expiracion: '',
    activo: true,
  })

  const openNewForm = () => {
    if (isFormOpen && !editingCoupon) {
      setIsFormOpen(false)
      return
    }
    setEditingCoupon(null)
    setFormData({
      codigo: '',
      descripcion: '',
      tipo_descuento: 'porcentaje',
      valor_descuento: 10,
      monto_minimo: 0,
      limite_usos: '',
      fecha_expiracion: '',
      activo: true,
    })
    setIsFormOpen(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const openEditForm = (c) => {
    setEditingCoupon(c)
    setFormData({
      codigo: c.codigo || '',
      descripcion: c.descripcion || '',
      tipo_descuento: c.tipo_descuento || 'porcentaje',
      valor_descuento: c.valor_descuento !== undefined ? c.valor_descuento : 10,
      monto_minimo: c.monto_minimo !== undefined ? c.monto_minimo : 0,
      limite_usos: c.limite_usos !== null && c.limite_usos !== undefined ? c.limite_usos : '',
      fecha_expiracion: c.fecha_expiracion ? String(c.fecha_expiracion).split('T')[0] : '',
      activo: Boolean(c.activo),
    })
    setIsFormOpen(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCoupon(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.codigo.trim()) {
      alert('Por favor ingresa un código para el cupón.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        codigo: formData.codigo.trim().toUpperCase(),
        descripcion: formData.descripcion.trim(),
        tipo_descuento: formData.tipo_descuento,
        valor_descuento: Number(formData.valor_descuento),
        monto_minimo: Number(formData.monto_minimo) || 0,
        limite_usos: formData.limite_usos ? Number(formData.limite_usos) : null,
        fecha_expiracion: formData.fecha_expiracion || null,
        activo: Boolean(formData.activo),
      }

      await onSaveCoupon(payload)
      closeForm()
    } catch (err) {
      alert(err.message || 'Error al guardar el cupón.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleDelete = (id, code) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente el cupón "${code}"?`)) {
      onDeleteCoupon(id)
      if (editingCoupon && editingCoupon.id === id) {
        closeForm()
      }
    }
  }

  // Filtrado
  const filteredCoupons = coupons.filter((c) => {
    const codeMatch = (c.codigo || '').toLowerCase().includes(search.toLowerCase())
    const descMatch = (c.descripcion || '').toLowerCase().includes(search.toLowerCase())
    const matchesSearch = codeMatch || descMatch

    if (statusFilter === 'ACTIVE') return matchesSearch && c.activo
    if (statusFilter === 'INACTIVE') return matchesSearch && !c.activo
    return matchesSearch
  })

  // Métricas calculadas para coincidir visualmente con el Dashboard
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.activo).length
  const totalUses = coupons.reduce((sum, c) => sum + (Number(c.veces_usado) || 0), 0)
  const percentageCount = coupons.filter((c) => c.tipo_descuento === 'porcentaje').length
  const fixedCount = coupons.filter((c) => c.tipo_descuento === 'fijo').length

  const couponsWithMin = coupons.filter((c) => Number(c.monto_minimo) > 0)
  const avgMin =
    couponsWithMin.length > 0
      ? (couponsWithMin.reduce((sum, c) => sum + Number(c.monto_minimo), 0) / couponsWithMin.length).toFixed(0)
      : '0'

  return (
    <div className="admin-view-content">
      {/* 1. KPI Cards Grid idéntico al Dashboard */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card highlight">
          <div className="kpi-top">
            <span className="kpi-label">CUPONES ACTIVOS</span>
            <span className="kpi-icon">🏷️</span>
          </div>
          <span className="kpi-value text-neon">
            {activeCoupons}{' '}
            <small className="kpi-subtext">/ {totalCoupons} totales</small>
          </span>
          <span className="kpi-note">↑ Disponibles para canjear en la tienda</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">CANJES REGISTRADOS</span>
            <span className="kpi-icon">⚡</span>
          </div>
          <span className="kpi-value">
            {totalUses}{' '}
            <small className="kpi-subtext">usos acumulados</small>
          </span>
          <span className="kpi-note text-neon">Impacto directo en conversión</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">MODALIDADES ACTIVAS</span>
            <span className="kpi-icon">💎</span>
          </div>
          <span className="kpi-value">
            {percentageCount} <small className="kpi-subtext">% OFF</small> / {fixedCount} <small className="kpi-subtext">S/ OFF</small>
          </span>
          <span className="kpi-note text-warning">Porcentuales y montos fijos</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">REQUISITO MÍNIMO</span>
            <span className="kpi-icon">🛒</span>
          </div>
          <span className="kpi-value">
            S/ {avgMin}{' '}
            <small className="kpi-subtext">promedio</small>
          </span>
          <span className="kpi-note">Condición de compra para canje</span>
        </div>
      </div>

      {/* 2. Barra de Filtros y Acciones */}
      <div className="admin-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por código (ej: MYCO10) o campaña..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Todos ({totalCoupons})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Activos ({activeCoupons})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            Inactivos ({totalCoupons - activeCoupons})
          </button>
        </div>

        <button
          type="button"
          className="btn-add-primary"
          onClick={openNewForm}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {isFormOpen && !editingCoupon ? '▲ Contraer Formulario' : '+ Crear Nuevo Cupón'}
        </button>
      </div>

      {/* 3. Formulario Inline que ALARGA la pantalla en lugar de abrir un modal */}
      {isFormOpen && (
        <div
          ref={formRef}
          className="admin-panel-card highlight admin-inline-expand-card"
          style={{
            borderColor: 'var(--border-bio)',
            background: 'linear-gradient(180deg, rgba(11, 18, 15, 0.95) 0%, rgba(6, 12, 10, 0.95) 100%)',
            boxShadow: '0 0 30px rgba(0, 245, 160, 0.1)',
          }}
        >
          <div className="panel-card-header">
            <div>
              <h3>
                {editingCoupon
                  ? `✏️ Modificar Cupón Promocional // ${editingCoupon.codigo}`
                  : '⚡ Registrar Nuevo Cupón de Descuento'}
              </h3>
              <span className="panel-sub">
                Ingresa los parámetros del descuento. El cupón se guardará directamente en la base de datos MySQL y estará listo para canje en tienda.
              </span>
            </div>
            <button
              type="button"
              className="btn-admin-subtle"
              onClick={closeForm}
              title="Cerrar y contraer este formulario"
            >
              ✕ Contraer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid-2">
              <div className="form-field">
                <label>
                  Código Promocional <span style={{ color: 'var(--neon-emerald)', fontSize: '0.75rem' }}>(Letras y números, sin espacios)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BIENVENIDA10, PROMO20, FUNGILOVE"
                  value={formData.codigo}
                  style={{
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--neon-emerald)',
                  }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codigo: e.target.value.toUpperCase().replace(/\s+/g, ''),
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Descripción / Campaña</label>
                <input
                  type="text"
                  placeholder="Ej: 10% de descuento de bienvenida en tu orden"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Modalidad de Descuento</label>
                <select
                  value={formData.tipo_descuento}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_descuento: e.target.value })
                  }
                >
                  <option value="porcentaje">Porcentaje (% de Descuento)</option>
                  <option value="fijo">Monto Fijo en Soles (S/ Descuento Fijo)</option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  Valor del Descuento {formData.tipo_descuento === 'porcentaje' ? '(%)' : '(S/ en Soles)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder={formData.tipo_descuento === 'porcentaje' ? 'Ej: 15 para 15%' : 'Ej: 20 para S/ 20.00'}
                  value={formData.valor_descuento}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_descuento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>
                  Monto Mínimo de Compra en Carrito <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(0 = Sin compra mínima)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0 = Aplica a cualquier compra"
                  value={formData.monto_minimo}
                  onChange={(e) =>
                    setFormData({ ...formData, monto_minimo: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Límite de Canjes Totales <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(Vacío = Canjes Ilimitados)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Dejar vacío para canjes sin límite"
                  value={formData.limite_usos}
                  onChange={(e) =>
                    setFormData({ ...formData, limite_usos: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>
                  Fecha de Expiración / Vencimiento <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(Opcional)</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_expiracion}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_expiracion: e.target.value })
                  }
                />
              </div>

              <div className="form-field" style={{ justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginTop: '1.25rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    style={{ width: '18px', height: '18px', accentColor: 'var(--neon-emerald)' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                    <strong>Cupón Activo</strong> (Los clientes pueden usarlo inmediatamente)
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-actions-footer" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={closeForm}
              >
                Cancelar y Ocultar
              </button>
              <button
                type="submit"
                className="btn-bio-primary"
                disabled={isSaving}
                style={{ minWidth: '160px' }}
              >
                {isSaving
                  ? 'Guardando...'
                  : editingCoupon
                  ? '✓ Actualizar Cupón ↗'
                  : '✓ Guardar y Publicar Cupón ↗'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Tabla de Cupones con Estructura de Panel del Dashboard */}
      <div className="admin-panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Catálogo de Cupones & Promociones Registradas</h3>
            <span className="panel-sub">
              {filteredCoupons.length} {filteredCoupons.length === 1 ? 'cupón mostrado' : 'cupones mostrados'} • Sincronización en tiempo real con MySQL
            </span>
          </div>
          {!isFormOpen && (
            <button
              type="button"
              className="btn-admin-subtle"
              onClick={openNewForm}
            >
              + Añadir Cupón ↗
            </button>
          )}
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código Promocional</th>
                <th>Descripción / Campaña</th>
                <th>Descuento</th>
                <th>Monto Mínimo</th>
                <th>Usos / Límite</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    🏷️ No se encontraron cupones registrados. Haz clic en <strong>"+ Crear Nuevo Cupón"</strong> para desplegar el formulario.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="order-id-badge" style={{ fontSize: '0.85rem' }}>
                          {c.codigo}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(c.codigo)}
                          title="Copiar código al portapapeles"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedCode === c.codigo ? 'var(--neon-emerald)' : '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '2px 4px',
                          }}
                        >
                          {copiedCode === c.codigo ? '✓' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#f3f4f6' }}>{c.descripcion || 'Sin descripción'}</strong>
                    </td>
                    <td>
                      <span className="status-pill status-ok" style={{ fontWeight: 700 }}>
                        {c.tipo_descuento === 'porcentaje'
                          ? `${c.valor_descuento}% OFF`
                          : `S/ ${Number(c.valor_descuento).toFixed(2)} OFF`}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {Number(c.monto_minimo) > 0
                          ? `S/ ${Number(c.monto_minimo).toFixed(2)}`
                          : 'Sin mínimo'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        <strong>{c.veces_usado}</strong> / {c.limite_usos ? c.limite_usos : '∞'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                        {c.fecha_expiracion ? c.fecha_expiracion : 'Sin vencimiento'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onToggleActive(c.id)}
                        className={`status-pill ${c.activo ? 'entregado' : 'status-danger'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Haz clic para alternar estado activo/inactivo"
                      >
                        {c.activo ? '● ACTIVO' : '○ INACTIVO'}
                      </button>
                    </td>
                    <td>
                      <div className="actions-cluster">
                        <button
                          type="button"
                          className="btn-icon-edit"
                          onClick={() => openEditForm(c)}
                          title="Editar cupón (despliega formulario)"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-icon-delete"
                          onClick={() => handleDelete(c.id, c.codigo)}
                          title="Eliminar cupón de la base de datos"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

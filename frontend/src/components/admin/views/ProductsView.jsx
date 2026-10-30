import React, { useState } from 'react'
import { authService } from '../../../services/authService'
import { formatImageUrl } from '../../../utils/imageUrl'
import { API_BASE_URL } from '../../../services/apiConfig'

export default function ProductsView({
  products,
  onSaveProduct,
  onDeleteProduct,
  onToggleActive,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    botanical: '',
    category: 'Cognitivo & Neurogénesis',
    priceValue: 89.0,
    concentration: '10:1 DUAL EXTRACT',
    extraction: 'Doble extracción hidroalcohólica ultrasónica',
    stock: 25,
    image: '',
    description: '',
    bioactives: '',
    usage: 'Consumir 1ml a 2ml diariamente (1 a 2 goteros) diluido en agua o infusión tibia.',
  })

  const openNewModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      botanical: '',
      category: 'Cognitivo & Neurogénesis',
      priceValue: 89.0,
      concentration: '10:1 DUAL EXTRACT',
      extraction: 'Doble extracción hidroalcohólica ultrasónica',
      stock: 25,
      image: '',
      description: '',
      bioactives: '',
      usage: 'Consumir 1ml a 2ml diariamente (1 a 2 goteros) diluido en agua o infusión tibia.',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (prod) => {
    setEditingProduct(prod)
    setFormData({
      name: prod.name || '',
      botanical: prod.botanical || prod.nombre_cientifico || '',
      category: prod.category || prod.categoria_nombre || 'Cognitivo & Neurogénesis',
      priceValue: prod.priceValue !== undefined ? prod.priceValue : Number(prod.precio || 89),
      concentration: prod.concentration || prod.concentracion || '10:1 DUAL EXTRACT',
      extraction: prod.extraction || prod.metodo_extraccion || 'Doble extracción hidroalcohólica ultrasónica',
      stock: prod.stock !== undefined ? prod.stock : (prod.stock_total || 25),
      image: prod.image || prod.imagen || '',
      description: prod.description || prod.descripcion || '',
      bioactives: prod.bioactives || prod.beneficios || '',
      usage: prod.usage || prod.dosis_recomendada || 'Consumir 1ml a 2ml diariamente diluido en agua o infusión.',
    })
    setIsModalOpen(true)
  }

  const processImageFile = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen seleccionada supera el límite máximo de 15MB.')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result
      // Mostrar la previsualización al instante
      setFormData((prev) => ({ ...prev, image: base64Data }))

      try {
        const session = authService.getStoredSession()
        const headers = { 'Content-Type': 'application/json' }
        if (session && session.token) {
          headers['Authorization'] = `Bearer ${session.token}`
        }

        const res = await fetch(`${API_BASE_URL}/productos/upload-imagen`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ imageBase64: base64Data }),
        })

        const json = await res.json()
        if (json.success && (json.imageUrl || json.relativeUrl)) {
          // Guardar URL completa o relativa devuelta por el servidor
          setFormData((prev) => ({ ...prev, image: json.imageUrl || json.relativeUrl }))
        }
      } catch (err) {
        console.warn('La imagen se preservará en base64 para previsualización:', err)
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name) return

    onSaveProduct({
      ...(editingProduct ? { id: editingProduct.id, number: editingProduct.number } : {}),
      ...formData,
      priceValue: Number(formData.priceValue),
    })

    setIsModalOpen(false)
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.botanical.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-view-content">
      {/* Top Action Bar */}
      <div className="admin-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o especie botánica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button type="button" className="btn-admin-primary" onClick={openNewModal}>
          + Nueva Fórmula / Producto
        </button>
      </div>

      {/* Products Table */}
      <div className="admin-panel-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre del Producto</th>
                <th>Especie Botánica</th>
                <th>Categoría / Enfoque</th>
                <th>Concentración</th>
                <th>Precio (S/)</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍄</div>
                    <strong>No hay productos registrados en el catálogo todavía.</strong>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                      Haz clic en <em>"+ Nueva Fórmula / Producto"</em> para registrar tu primer extracto con su precio, stock y fotografía.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.image ? (
                        <img
                          src={formatImageUrl(p.image)}
                          alt={p.name}
                          className="product-table-thumb"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.5'
                          }}
                        />
                      ) : (
                        <div className="product-table-thumb-placeholder">🍄</div>
                      )}
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <span className="cell-sub">#{p.number}</span>
                    </td>
                    <td>
                      <em>{p.botanical}</em>
                    </td>
                    <td>
                      <span className="admin-tag-pill">{p.category}</span>
                    </td>
                    <td>{p.concentration}</td>
                    <td>
                      <strong>S/ {Number(p.priceValue).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${
                          p.stock < 10 ? 'danger' : p.stock < 20 ? 'warning' : 'ok'
                        }`}
                      >
                        {p.stock} uds
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn-status-toggle ${p.active ? 'active' : 'inactive'}`}
                        onClick={() => onToggleActive(p.id)}
                      >
                        {p.active ? '● Publicado' : '○ Pausado'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => openEditModal(p)}
                          title="Editar producto"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon danger"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar definitivamente el producto "${p.name}"?`)) {
                              onDeleteProduct(p.id)
                            }
                          }}
                          title="Eliminar producto"
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

      {/* Edit / Create Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>
                {editingProduct ? 'Editar Fórmula Fúngica' : 'Registrar Nuevo Producto'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Nombre Comercial del Producto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    placeholder="Ej: Melena de León Doble Extracto"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Especie Científica / Botánica</label>
                  <input
                    type="text"
                    required
                    value={formData.botanical}
                    placeholder="Ej: Hericium erinaceus"
                    onChange={(e) =>
                      setFormData({ ...formData, botanical: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Precio de Venta (Soles - S/)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.priceValue}
                    onChange={(e) =>
                      setFormData({ ...formData, priceValue: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Stock Disponible (Unidades)</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Concentración / Presentación</label>
                  <input
                    type="text"
                    required
                    value={formData.concentration}
                    placeholder="Ej: 10:1 DUAL EXTRACT, 60 cápsulas de 500mg, Frasco 30ml"
                    onChange={(e) =>
                      setFormData({ ...formData, concentration: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Categoría / Clasificación <span style={{ fontSize: '0.75rem', color: 'var(--neon-emerald)', fontWeight: 400 }}>(Editable libremente)</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={formData.category}
                    placeholder="Escribe o selecciona una categoría..."
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                  <datalist id="category-suggestions">
                    <option value="Cognitivo & Neurogénesis" />
                    <option value="Equilibrio & Sueño" />
                    <option value="Vitalidad & Rendimiento ATP" />
                    <option value="Inmunomodulación & Longevidad" />
                    <option value="Digestivo & Microbiota" />
                    <option value="Antioxidante & Cuidado Celular" />
                    <option value="Extractos Líquidos" />
                    <option value="Cápsulas & Suplementos" />
                    <option value="Polvos & Microdosis" />
                  </datalist>
                </div>
              </div>

              {/* Subir Archivo de Imagen */}
              <div className="form-field">
                <label>Fotografía del Producto (Subir Archivo)</label>
                <div className="image-upload-box">
                  {formData.image ? (
                    <div className="image-preview-wrapper">
                      <img
                        src={formatImageUrl(formData.image)}
                        alt="Vista previa del producto"
                        className="uploaded-thumb-preview"
                      />
                      <div className="image-preview-info">
                        <span className="image-preview-status">
                          {isUploading ? '⏳ Subiendo al servidor...' : '✓ Fotografía lista'}
                        </span>
                        <div className="image-preview-actions">
                          <label htmlFor="product-img-upload-input" className="btn-change-image">
                            Cambiar Archivo
                          </label>
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() => setFormData({ ...formData, image: '' })}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="product-img-upload-input"
                      className={`image-dropzone-label ${isDragging ? 'is-dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <span className="dropzone-icon">{isDragging ? '📥' : '📁'}</span>
                      <span className="dropzone-text">
                        {isUploading
                          ? 'Subiendo imagen...'
                          : isDragging
                          ? 'Suelta la imagen aquí...'
                          : 'Haz clic aquí o arrastra la foto del producto desde tu equipo'}
                      </span>
                      <span className="dropzone-sub">Formatos compatibles: JPG, PNG, WEBP (Hasta 15MB)</span>
                    </label>
                  )}
                  <input
                    id="product-img-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFileChange}
                  />
                </div>
              </div>

              {/* Sección de Ficha Técnica de Laboratorio */}
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid rgba(0, 245, 160, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔬</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--neon-emerald)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      ESPECIFICACIONES DE LA FICHA TÉCNICA
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Estos detalles se mostrarán al cliente cuando abra "Ver Ficha Técnica" en la tienda.
                    </span>
                  </div>
                </div>

                <div className="form-field">
                  <label>Descripción del Producto (Ficha Técnica)</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    placeholder="Ej: Extracto concentrado obtenido mediante doble extracción ultrasónica. Estimula la síntesis de factores neurotróficos y optimiza el enfoque cognitivo..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Compuestos Activos Principales</label>
                  <input
                    type="text"
                    value={formData.bioactives}
                    placeholder="Ej: Hericenonas, Erinacinas, 1,3/1,6 Beta-Glucanos solubles"
                    onChange={(e) =>
                      setFormData({ ...formData, bioactives: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Método de Extracción / Elaboración</label>
                  <input
                    type="text"
                    value={formData.extraction}
                    placeholder="Ej: Doble extracción hidroalcohólica ultrasónica, Agua caliente a presión, Fruto 100% puro"
                    onChange={(e) =>
                      setFormData({ ...formData, extraction: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Protocolo de Consumo Recomendado (Dosis)</label>
                  <input
                    type="text"
                    value={formData.usage}
                    placeholder="Ej: Consumir 1ml a 2ml diariamente (1 a 2 goteros) diluido en agua o infusión tibia."
                    onChange={(e) =>
                      setFormData({ ...formData, usage: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-admin-primary" disabled={isUploading}>
                  {editingProduct ? 'Guardar Cambios ↗' : 'Publicar Producto ↗'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

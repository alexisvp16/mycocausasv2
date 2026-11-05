import React, { useState } from 'react'
import { formatImageUrl } from '../../../utils/imageUrl'
import { Search, Eye, MessageSquare } from 'lucide-react'

export default function OrdersView({ orders, onUpdateOrderStatus }) {
  const [filter, setFilter] = useState('TODOS')
  const [search, setSearch] = useState('')

  const filteredOrders = orders.filter((ord) => {
    const matchFilter = filter === 'TODOS' || ord.status === filter
    const matchSearch =
      ord.customer.toLowerCase().includes(search.toLowerCase()) ||
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      ord.phone.includes(search)
    return matchFilter && matchSearch
  })

  return (
    <div className="admin-view-content">
      {/* Top Filter Bar */}
      <div className="admin-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon"><Search size={15} /></span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          {['TODOS', 'Pendiente', 'En Preparación', 'Enviado', 'Entregado'].map(
            (status) => (
              <button
                key={status}
                type="button"
                className={`filter-pill-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-panel-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha / Hora</th>
                <th>Cliente & Contacto</th>
                <th>Artículos del Pedido</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    No se encontraron pedidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <span className="order-id-badge">{ord.id}</span>
                    </td>
                    <td>
                      <span className="date-main">{ord.date}</span>
                    </td>
                    <td>
                      <strong>{ord.customer}</strong>
                      <span className="cell-sub">{ord.phone}</span>
                      <span className="cell-sub">{ord.city}</span>
                    </td>
                    <td>
                      <ul className="order-items-mini-list">
                        {ord.items.map((it, idx) => (
                          <li key={idx}>
                            {it.name} <strong>x{it.qty}</strong>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <span className="payment-badge">{ord.paymentMethod}</span>
                      {ord.comprobanteUrl ? (
                        <a
                          href={formatImageUrl(ord.comprobanteUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--neon-emerald)',
                            marginTop: '6px',
                            fontWeight: 600,
                            textDecoration: 'underline',
                          }}
                          title="Abrir captura o voucher en pestaña nueva"
                        >
                          <Eye size={12} /> Ver Voucher ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                          Sin voucher
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="order-total-price">
                        S/ {ord.total.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-select-status"
                        value={ord.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(ord.id, e.target.value)
                        }
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Preparación">En Preparación</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
                          ord.customer
                        )},%20te%20escribimos%20de%20Myco%20Causas%20respecto%20a%20tu%20pedido%20${
                          ord.id
                        }.`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-action-whatsapp"
                        title="Contactar al cliente por WhatsApp"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
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

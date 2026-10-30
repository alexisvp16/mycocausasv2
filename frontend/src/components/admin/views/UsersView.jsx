import React, { useState } from 'react'

export default function UsersView({ users, onToggleUserStatus }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      String(u.phone || '').includes(search)
    
    let matchRole = true
    if (roleFilter === 'cliente' || roleFilter === 'client') {
      matchRole = u.role === 'cliente' || u.role === 'client'
    } else if (roleFilter === 'admin') {
      matchRole = u.role === 'admin'
    }
    return matchSearch && matchRole
  })

  return (
    <div className="admin-view-content">
      {/* Top Filter Bar */}
      <div className="admin-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar usuario por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button
            type="button"
            className={`filter-pill-btn ${roleFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${roleFilter === 'cliente' || roleFilter === 'client' ? 'active' : ''}`}
            onClick={() => setRoleFilter('cliente')}
          >
            Clientes
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Administradores
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-panel-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre y Apellidos</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Rol de Acceso</th>
                <th>Fecha de Registro</th>
                <th>Pedidos Hechos</th>
                <th>Estado de Cuenta</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
                    No se encontraron usuarios registrados con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="order-id-badge">#{u.id}</span>
                  </td>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span
                      className={`role-pill ${
                        u.role === 'admin' ? 'role-admin' : 'role-client'
                      }`}
                    >
                      {u.role === 'admin' ? '👑 Administrador' : '🔬 Investigador/Cliente'}
                    </span>
                  </td>
                  <td>{u.registeredDate}</td>
                  <td>
                    <strong>{u.ordersCount}</strong> órdenes
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        u.status === 'Activo' ? 'status-ok' : 'status-danger'
                      }`}
                    >
                      ● {u.status}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        className="btn-toggle-user"
                        onClick={() => onToggleUserStatus(u.id)}
                      >
                        {u.status === 'Activo' ? 'Desactivar' : 'Reactivar'}
                      </button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

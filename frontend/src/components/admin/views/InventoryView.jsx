import React, { useState } from 'react'

export default function InventoryView({ inventory, onUpdateBatchStock }) {
  const [search, setSearch] = useState('')

  const filteredInventory = inventory.filter(
    (item) =>
      item.batchCode.toLowerCase().includes(search.toLowerCase()) ||
      item.species.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-view-content">
      {/* Search & Overview Header */}
      <div className="admin-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por lote o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="inventory-summary-pill">
          <span>LOTES ACTIVOS EN LABORATORIO:</span>
          <strong>{inventory.length}</strong>
        </div>
      </div>

      {/* Batches Table */}
      <div className="admin-panel-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código de Lote</th>
                <th>Especie Micológica</th>
                <th>Stock Disponible</th>
                <th>Pureza HPLC</th>
                <th>Beta-Glucanos</th>
                <th>Fecha Extracción</th>
                <th>Vencimiento</th>
                <th>Certificación COA</th>
                <th>Ajustar Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔬</div>
                    <strong>No hay lotes de extracción registrados aún.</strong>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                      Al registrar tus productos o recepcionar stock, podrás asignar códigos de lote y pureza HPLC aquí.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                <tr key={item.batchCode}>
                  <td>
                    <span className="batch-code-pill">{item.batchCode}</span>
                  </td>
                  <td>
                    <strong>{item.species}</strong>
                  </td>
                  <td>
                    <span
                      className={`stock-badge ${
                        item.unitsAvailable <= item.thresholdMin
                          ? 'danger'
                          : 'ok'
                      }`}
                    >
                      {item.unitsAvailable} unidades
                    </span>
                    {item.unitsAvailable <= item.thresholdMin && (
                      <span className="stock-alert-text">⚠️ Bajo Mínimo</span>
                    )}
                  </td>
                  <td>
                    <span className="text-neon">{item.purityHPLC}</span>
                  </td>
                  <td>
                    <strong>{item.betaGlucans}</strong>
                  </td>
                  <td>{item.extractionDate}</td>
                  <td>{item.expiryDate}</td>
                  <td>
                    <span className="badge-coa-ok">✓ {item.coaStatus}</span>
                  </td>
                  <td>
                    <div className="stock-control-buttons">
                      <button
                        type="button"
                        className="btn-stock-adjust minus"
                        onClick={() => onUpdateBatchStock(item.batchCode, -1)}
                        title="Restar 1 unidad"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="btn-stock-adjust plus"
                        onClick={() => onUpdateBatchStock(item.batchCode, 5)}
                        title="Sumar 5 unidades"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        className="btn-stock-adjust plus-large"
                        onClick={() => onUpdateBatchStock(item.batchCode, 20)}
                        title="Sumar nuevo lote (+20)"
                      >
                        +20
                      </button>
                    </div>
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

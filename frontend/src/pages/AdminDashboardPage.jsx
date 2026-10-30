import React, { useState } from 'react'
import { adminService } from '../services/adminService'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import DashboardView from '../components/admin/views/DashboardView'
import OrdersView from '../components/admin/views/OrdersView'
import ProductsView from '../components/admin/views/ProductsView'
import InventoryView from '../components/admin/views/InventoryView'
import UsersView from '../components/admin/views/UsersView'
import CouponsView from '../components/admin/views/CouponsView'
import ReportsView from '../components/admin/views/ReportsView'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Estado reactivo local alimentado por adminService
  const [orders, setOrders] = useState(() => adminService.getOrders())
  const [products, setProducts] = useState(() => adminService.getProducts())
  const [inventory, setInventory] = useState(() => adminService.getInventory())
  const [users, setUsers] = useState(() => adminService.getUsers())
  const [coupons, setCoupons] = useState(() => adminService.getCoupons())

  // Sincronización en vivo con backend MySQL
  const syncWithBackend = React.useCallback(() => {
    adminService.fetchFromBackend().then((res) => {
      if (res) {
        if (res.orders) setOrders(res.orders)
        if (res.products) setProducts(res.products)
        if (res.inventory) setInventory(res.inventory)
        if (res.users) setUsers(res.users)
        if (res.coupons) setCoupons(res.coupons)
      }
    })
  }, [])

  React.useEffect(() => {
    syncWithBackend()
  }, [activeTab, syncWithBackend])

  // Polling automático cada 10s para capturar nuevos usuarios y pedidos en tiempo real
  React.useEffect(() => {
    const timer = setInterval(() => {
      syncWithBackend()
    }, 10000)
    return () => clearInterval(timer)
  }, [syncWithBackend])

  // Métricas calculadas en vivo
  const metrics = adminService.getDashboardMetrics()

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const updated = await adminService.updateOrderStatus(orderId, newStatus)
    setOrders(updated)
    syncWithBackend()
  }

  const handleSaveProduct = async (productData) => {
    const updated = await adminService.saveProduct(productData)
    setProducts(updated)
    await syncWithBackend()
  }

  const handleDeleteProduct = async (productId) => {
    const updated = await adminService.deleteProduct(productId)
    setProducts(updated)
    await syncWithBackend()
  }

  const handleToggleProductActive = async (productId) => {
    const updated = await adminService.toggleProductActive(productId)
    setProducts(updated)
    await syncWithBackend()
  }

  const handleUpdateBatchStock = (batchCode, delta) => {
    const updated = adminService.updateBatchStock(batchCode, delta)
    setInventory(updated)
  }

  const handleToggleUserStatus = (userId) => {
    const updated = adminService.toggleUserStatus(userId)
    setUsers(updated)
  }

  const handleSaveCoupon = async (couponData) => {
    const updated = await adminService.saveCoupon(couponData)
    setCoupons(updated)
  }

  const handleDeleteCoupon = async (couponId) => {
    const updated = await adminService.deleteCoupon(couponId)
    setCoupons(updated)
  }

  const handleToggleCouponActive = async (couponId) => {
    const updated = await adminService.toggleCouponActive(couponId)
    setCoupons(updated)
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar de Navegación del Panel */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOrdersCount={metrics.pendingOrders}
        lowStockCount={metrics.lowStockCount}
      />

      {/* Contenedor Principal de Administración */}
      <div className="admin-main-container">
        <AdminHeader activeTab={activeTab} />

        <main className="admin-page-body">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              orders={orders}
              inventory={inventory}
              onNavigateTab={setActiveTab}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'pedidos' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'productos' && (
            <ProductsView
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleActive={handleToggleProductActive}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryView
              inventory={inventory}
              onUpdateBatchStock={handleUpdateBatchStock}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersView
              users={users}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {activeTab === 'cupones' && (
            <CouponsView
              coupons={coupons}
              onSaveCoupon={handleSaveCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onToggleActive={handleToggleCouponActive}
            />
          )}

          {activeTab === 'reportes' && <ReportsView metrics={metrics} />}
        </main>
      </div>
    </div>
  )
}

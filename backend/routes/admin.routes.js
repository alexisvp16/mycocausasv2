/**
 * MYCO CAUSAS v2 - Rutas de Backoffice Administrativo y Métricas
 * KPIs del negocio, administración de usuarios y registros de auditoría
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de este archivo
router.use(verifyToken, requireAdmin);

/**
 * GET /api/admin/dashboard
 * Métricas consolidadas para el panel de control
 */
const handleDashboard = async (req, res) => {
  try {
    // 1. Total facturado y conteo de órdenes
    const [ventasStats] = await db.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_ventas,
        COUNT(id) AS total_pedidos,
        COUNT(CASE WHEN estado IN ('Pendiente', 'En Preparación', 'Enviado') THEN 1 END) AS pedidos_activos,
        COUNT(CASE WHEN estado = 'Entregado' THEN 1 END) AS pedidos_entregados
      FROM pedidos
    `);

    // 2. Total de usuarios registrados
    const [userStats] = await db.query(`
      SELECT 
        COUNT(id) AS total_usuarios,
        COUNT(CASE WHEN rol = 'cliente' THEN 1 END) AS total_clientes,
        COUNT(CASE WHEN rol = 'admin' THEN 1 END) AS total_admins
      FROM usuarios
      WHERE activo = 1
    `);

    // 3. Alertas de stock crítico
    const [stockStats] = await db.query(`
      SELECT 
        COUNT(id) AS productos_bajo_stock
      FROM productos
      WHERE stock_total <= 20 AND activo = 1
    `);

    // 4. Últimos 5 pedidos
    const [ultimosPedidos] = await db.query(`
      SELECT 
        id, numero_orden, nombre_cliente, total, estado, metodo_pago, fecha_pedido
      FROM pedidos
      ORDER BY id DESC
      LIMIT 5
    `);

    // 5. Últimos 5 registros de auditoría de seguridad
    const [ultimosLogs] = await db.query(`
      SELECT 
        id, evento, ip_origen, detalles, created_at
      FROM auditoria_seguridad
      ORDER BY id DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalVentas: Number(ventasStats[0].total_ventas),
          totalPedidos: ventasStats[0].total_pedidos,
          pedidosActivos: ventasStats[0].pedidos_activos,
          pedidosEntregados: ventasStats[0].pedidos_entregados,
          totalUsuarios: userStats[0].total_usuarios,
          totalClientes: userStats[0].total_clientes,
          productosBajoStock: stockStats[0].productos_bajo_stock
        },
        ultimosPedidos,
        ultimosLogs
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar métricas del panel.'
    });
  }
};

router.get('/dashboard', handleDashboard);
router.get('/dashboard/stats', handleDashboard);
router.get('/stats', handleDashboard);

/**
 * GET /api/admin/usuarios
 * Lista completa de usuarios registrados
 */
router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query(
      'SELECT id, nombre, email, telefono, rol, activo, email_verificado, intentos_fallidos, ultimo_acceso, created_at FROM usuarios ORDER BY id ASC'
    );
    return res.json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    console.error('Error en GET /api/admin/usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios.'
    });
  }
});

/**
 * PATCH /api/admin/usuarios/:id
 * Modificar rol o activar/desactivar usuario
 */
router.patch('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, activo } = req.body;

    // Evitar auto-bloqueo del administrador actual
    if (Number(id) === req.user.id && activo === 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta administradora.'
      });
    }

    await db.query(
      'UPDATE usuarios SET rol = COALESCE(?, rol), activo = COALESCE(?, activo) WHERE id = ?',
      [rol, activo, id]
    );

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error en PATCH /api/admin/usuarios/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario.'
    });
  }
});

/**
 * GET /api/admin/auditoria
 * Registro de auditoría y eventos de ciberseguridad
 */
router.get('/auditoria', async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM auditoria_seguridad a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY a.id DESC
       LIMIT 100`
    );
    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error en GET /api/admin/auditoria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar logs de seguridad.'
    });
  }
});

module.exports = router;

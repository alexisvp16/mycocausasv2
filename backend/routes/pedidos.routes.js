/**
 * MYCO CAUSAS v2 - Rutas de Pedidos, Checkout y Logística
 * Gestión transaccional de órdenes de compra y actualización de existencias
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin, optionalAuth } = require('../middlewares/authMiddleware');

/**
 * GET /api/pedidos
 * Lista de pedidos:
 * - Si es Admin: lista todos los pedidos del sistema
 * - Si es Cliente: lista únicamente sus propios pedidos
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.rol === 'admin';
    let query = '';
    let params = [];

    if (isAdmin) {
      query = `
        SELECT 
          p.id,
          p.numero_orden,
          p.usuario_id,
          p.nombre_cliente,
          p.email_cliente,
          p.telefono_cliente,
          p.departamento,
          p.ciudad,
          p.direccion_envio,
          p.metodo_pago,
          p.estado_pago,
          p.subtotal,
          p.descuento,
          p.cupon_codigo,
          p.costo_envio,
          p.total,
          p.estado,
          p.guia_tracking,
          p.fecha_pedido,
          COUNT(dp.id) AS total_items,
          COALESCE(SUM(dp.cantidad), 0) AS total_unidades,
          GROUP_CONCAT(CONCAT(dp.nombre_producto, ' (x', dp.cantidad, ')') SEPARATOR ', ') AS resumen_productos
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        GROUP BY p.id
        ORDER BY p.id DESC
      `;
    } else {
      query = `
        SELECT 
          p.id,
          p.numero_orden,
          p.nombre_cliente,
          p.email_cliente,
          p.telefono_cliente,
          p.direccion_envio,
          p.ciudad,
          p.departamento,
          p.metodo_pago,
          p.estado_pago,
          p.subtotal,
          p.descuento,
          p.cupon_codigo,
          p.costo_envio,
          p.total,
          p.estado,
          p.guia_tracking,
          p.fecha_pedido,
          COUNT(dp.id) AS total_items,
          COALESCE(SUM(dp.cantidad), 0) AS total_unidades,
          GROUP_CONCAT(CONCAT(dp.nombre_producto, ' (x', dp.cantidad, ')') SEPARATOR ', ') AS resumen_productos
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        WHERE p.usuario_id = ? OR (p.email_cliente IS NOT NULL AND LOWER(p.email_cliente) = LOWER(?))
        GROUP BY p.id
        ORDER BY p.id DESC
      `;
      params = [req.user.id, req.user.email || ''];
    }

    const [pedidos] = await db.query(query, params);

    return res.json({
      success: true,
      count: pedidos.length,
      data: pedidos
    });
  } catch (error) {
    console.error('Error en GET /api/pedidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar órdenes.'
    });
  }
});

/**
 * GET /api/pedidos/:id
 * Detalle completo de una orden con sus ítems adquiridos
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.rol === 'admin';

    const [pedidos] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.'
      });
    }

    const pedido = pedidos[0];

    // Verificar permisos: solo admin o el dueño del pedido (por ID o por email)
    const isOwner = (pedido.usuario_id && req.user.id && pedido.usuario_id === req.user.id) ||
      (pedido.email_cliente && req.user.email && pedido.email_cliente.toLowerCase() === req.user.email.toLowerCase());

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado a esta orden.'
      });
    }

    const [items] = await db.query(
      'SELECT id, producto_id, lote_id, nombre_producto, codigo_lote, precio_unitario, cantidad, subtotal FROM detalle_pedidos WHERE pedido_id = ?',
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...pedido,
        items
      }
    });
  } catch (error) {
    console.error('Error en GET /api/pedidos/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de pedido.'
    });
  }
});

/**
 * POST /api/pedidos
 * Crear una nueva orden de compra con transacción ACID y descuento de inventario
 */
router.post('/', optionalAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      nombre_cliente,
      email_cliente,
      telefono_cliente,
      departamento,
      ciudad,
      direccion_envio,
      referencia_direccion,
      metodo_pago,
      costo_envio,
      notas_cliente,
      items
    } = req.body;

    if (!nombre_cliente || !email_cliente || !telefono_cliente || !direccion_envio) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Los datos de contacto y dirección de envío son obligatorios.'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'El pedido debe contener al menos un producto.'
      });
    }

    await connection.beginTransaction();

    // 1. Calcular subtotal y validar stock
    let subtotalCalculado = 0;
    const itemsValidados = [];

    for (const item of items) {
      const [prods] = await connection.query(
        'SELECT id, nombre, precio, stock_total FROM productos WHERE id = ? FOR UPDATE',
        [item.producto_id]
      );

      if (prods.length === 0) {
        throw new Error(`Producto con ID ${item.producto_id} no existe.`);
      }

      const prod = prods[0];
      const cantidad = Number(item.cantidad) || 1;

      if (prod.stock_total < cantidad) {
        throw new Error(`Stock insuficiente para "${prod.nombre}". Disponibles: ${prod.stock_total}.`);
      }

      const itemSubtotal = Number(prod.precio) * cantidad;
      subtotalCalculado += itemSubtotal;

      // Buscar lote activo para asignación de trazabilidad
      const [lotes] = await connection.query(
        'SELECT id, codigo_lote, unidades_disponibles FROM lotes_inventario WHERE producto_id = ? AND estado_coa = "Certificado" AND unidades_disponibles >= ? LIMIT 1 FOR UPDATE',
        [prod.id, cantidad]
      );

      const loteId = lotes.length > 0 ? lotes[0].id : null;
      const loteCodigo = lotes.length > 0 ? lotes[0].codigo_lote : null;

      itemsValidados.push({
        producto_id: prod.id,
        lote_id: loteId,
        codigo_lote: loteCodigo,
        nombre_producto: prod.nombre,
        precio_unitario: Number(prod.precio),
        cantidad,
        subtotal: itemSubtotal
      });
    }

    const envio = Number(costo_envio) || 0.00;
    let montoDescuento = 0.00;
    let cuponCodigoValido = null;

    // Validación estricta en base de datos del cupón de descuento
    if (req.body.cupon_codigo && req.body.cupon_codigo.trim()) {
      const candidateCode = req.body.cupon_codigo.trim().toUpperCase();
      const [cupones] = await connection.query(
        'SELECT * FROM cupones WHERE UPPER(codigo) = ? AND activo = 1 LIMIT 1 FOR UPDATE',
        [candidateCode]
      );

      if (cupones.length > 0) {
        const c = cupones[0];
        let cuponValido = true;

        // Comprobar fecha expiración
        if (c.fecha_expiracion) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const exp = new Date(c.fecha_expiracion);
          exp.setHours(0, 0, 0, 0);
          if (exp < hoy) cuponValido = false;
        }

        // Comprobar límite de usos
        if (c.limite_usos !== null && c.veces_usado >= c.limite_usos) {
          cuponValido = false;
        }

        // Comprobar monto mínimo
        if (Number(c.monto_minimo) > 0 && subtotalCalculado < Number(c.monto_minimo)) {
          cuponValido = false;
        }

        if (cuponValido) {
          cuponCodigoValido = c.codigo;
          if (c.tipo_descuento === 'porcentaje') {
            montoDescuento = (subtotalCalculado * Number(c.valor_descuento)) / 100;
          } else {
            montoDescuento = Math.min(subtotalCalculado, Number(c.valor_descuento));
          }
          montoDescuento = Number(montoDescuento.toFixed(2));
        } else {
          throw new Error(`El cupón "${candidateCode}" no cumple las condiciones de validez, monto mínimo o ha expirado.`);
        }
      } else {
        throw new Error(`El cupón "${candidateCode}" no existe o se encuentra inactivo.`);
      }
    }

    const totalFinal = Math.max(0, Number((subtotalCalculado - montoDescuento + envio).toFixed(2)));

    // 2. Generar número de orden único correlativo
    const [lastOrder] = await connection.query('SELECT id FROM pedidos ORDER BY id DESC LIMIT 1');
    const nextSeq = lastOrder.length > 0 ? lastOrder[0].id + 1 : 1;
    const numeroOrden = `ORD-2026-${String(nextSeq).padStart(3, '0')}`;

    // 3. Insertar cabecera de pedido
    const usuarioId = req.user ? req.user.id : null;

    const [pedidoResult] = await connection.query(
      `INSERT INTO pedidos (
        numero_orden, usuario_id, nombre_cliente, email_cliente, telefono_cliente,
        departamento, ciudad, direccion_envio, referencia_direccion, metodo_pago,
        estado_pago, subtotal, descuento, cupon_codigo, costo_envio, total, estado, notas_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?, ?, ?, 'Pendiente', ?)`,
      [
        numeroOrden,
        usuarioId,
        nombre_cliente.trim(),
        email_cliente.trim().toLowerCase(),
        telefono_cliente.trim(),
        departamento || 'Lima',
        ciudad || 'Lima',
        direccion_envio.trim(),
        referencia_direccion || null,
        metodo_pago || 'Yape',
        subtotalCalculado,
        montoDescuento,
        cuponCodigoValido,
        envio,
        totalFinal,
        notas_cliente || null
      ]
    );

    const pedidoId = pedidoResult.insertId;

    // Incrementar veces_usado en cupones si aplica
    if (cuponCodigoValido) {
      try {
        await connection.query(
          'UPDATE cupones SET veces_usado = veces_usado + 1 WHERE UPPER(codigo) = ?',
          [cuponCodigoValido]
        );
      } catch (errCupon) {
        console.warn('No se pudo incrementar uso de cupón:', errCupon.message);
      }
    }

    // 4. Insertar detalles y descontar stock
    for (const iv of itemsValidados) {
      await connection.query(
        `INSERT INTO detalle_pedidos (
          pedido_id, producto_id, lote_id, nombre_producto, codigo_lote,
          precio_unitario, cantidad, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          iv.producto_id,
          iv.lote_id,
          iv.nombre_producto,
          iv.codigo_lote,
          iv.precio_unitario,
          iv.cantidad,
          iv.subtotal
        ]
      );

      // Descontar del producto
      await connection.query(
        'UPDATE productos SET stock_total = GREATEST(0, stock_total - ?) WHERE id = ?',
        [iv.cantidad, iv.producto_id]
      );

      // Descontar del lote si fue asignado
      if (iv.lote_id) {
        await connection.query(
          'UPDATE lotes_inventario SET unidades_disponibles = GREATEST(0, unidades_disponibles - ?) WHERE id = ?',
          [iv.cantidad, iv.lote_id]
        );
      }
    }

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Pedido registrado con éxito.',
      numero_orden: numeroOrden,
      pedido_id: pedidoId,
      total: totalFinal,
      data: {
        id: pedidoId,
        numero_orden: numeroOrden,
        total: totalFinal
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error en POST /api/pedidos:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al procesar el pedido.'
    });
  }
});

/**
 * Funciones de sanitización de datos personales para telemetría pública
 */
function maskName(name) {
  if (!name) return 'Cliente Myco';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.length <= 2 ? word : word[0] + '*'.repeat(Math.min(5, word.length - 1)))
    .join(' ');
}

function maskPhone(phone) {
  if (!phone) return '*** *** ***';
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 9) {
    const end = digits.slice(-3);
    const start = digits.startsWith('51') ? '+51 ' + digits.slice(2, 5) : digits.slice(0, 3);
    return `${start} *** ${end}`;
  }
  return clean.slice(0, 2) + '***' + clean.slice(-2);
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  const maskedUser = user.length <= 2 ? user[0] + '***' : user[0] + '***' + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

function maskAddress(addr) {
  if (!addr) return 'Dirección registrada en laboratorio';
  const parts = addr.trim().split(/\s+/);
  if (parts.length <= 2) return `${parts[0]} *** (Protegido por Privacidad)`;
  return `${parts[0]} ${parts[1][0]}*** (Protegido por Privacidad)`;
}

/**
 * GET /api/pedidos/tracking/:codigoOrId
 * Endpoint público de seguimiento y tracking de pedido en tiempo real (4 estados)
 * Aplica enmascaramiento estricto de datos sensibles (PII) para usuarios no propietarios.
 */
router.get('/tracking/:codigoOrId', optionalAuth, async (req, res) => {
  try {
    const { codigoOrId } = req.params;
    const clean = codigoOrId.trim();

    const [pedidos] = await db.query(
      `SELECT 
        p.id,
        p.numero_orden,
        p.usuario_id,
        p.nombre_cliente,
        p.email_cliente,
        p.telefono_cliente,
        p.departamento,
        p.ciudad,
        p.direccion_envio,
        p.referencia_direccion,
        p.metodo_pago,
        p.estado_pago,
        p.subtotal,
        p.descuento,
        p.cupon_codigo,
        p.costo_envio,
        p.total,
        p.estado,
        p.guia_tracking,
        p.notas_cliente,
        p.fecha_pedido,
        p.updated_at
      FROM pedidos p
      WHERE p.numero_orden = ? OR p.id = ?
      LIMIT 1`,
      [clean, isNaN(clean) ? 0 : Number(clean)]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ningún pedido con el código o ID "${clean}".`
      });
    }

    const pedido = pedidos[0];

    const [items] = await db.query(
      `SELECT 
        dp.id,
        dp.producto_id,
        dp.nombre_producto,
        dp.codigo_lote,
        dp.precio_unitario,
        dp.cantidad,
        dp.subtotal,
        p.imagen
      FROM detalle_pedidos dp
      LEFT JOIN productos p ON p.id = dp.producto_id
      WHERE dp.pedido_id = ?`,
      [pedido.id]
    );

    // Mapeo estructurado de los 4 estados principales
    const estadosTracking = [
      {
        key: 'Pendiente',
        label: '1. Pedido Recibido',
        subtitulo: 'Verificación de datos y confirmación de pago',
        step: 1
      },
      {
        key: 'En Preparación',
        label: '2. En Preparación',
        subtitulo: 'Selección, formulación y embalaje en laboratorio',
        step: 2
      },
      {
        key: 'Enviado',
        label: '3. En Camino',
        subtitulo: 'Despachado con courier y en ruta de entrega',
        step: 3
      },
      {
        key: 'Entregado',
        label: '4. Entregado',
        subtitulo: 'Paquete recibido satisfactoriamente por el cliente',
        step: 4
      }
    ];

    let currentStep = 1;
    if (pedido.estado === 'En Preparación') currentStep = 2;
    else if (pedido.estado === 'Enviado') currentStep = 3;
    else if (pedido.estado === 'Entregado') currentStep = 4;
    else if (pedido.estado === 'Cancelado') currentStep = 0;

    // Verificar si el solicitante es el propietario o un Administrador
    const isOwnerOrAdmin = req.user && (
      req.user.rol === 'admin' ||
      (pedido.usuario_id && req.user.id === pedido.usuario_id)
    );

    // Enmascarar información sensible si es consulta pública
    const safePedido = isOwnerOrAdmin ? { ...pedido } : {
      ...pedido,
      usuario_id: null,
      nombre_cliente: maskName(pedido.nombre_cliente),
      email_cliente: maskEmail(pedido.email_cliente),
      telefono_cliente: maskPhone(pedido.telefono_cliente),
      direccion_envio: maskAddress(pedido.direccion_envio),
      referencia_direccion: null,
      notas_cliente: null
    };

    return res.json({
      success: true,
      data: {
        ...safePedido,
        items,
        currentStep,
        estadosTracking
      }
    });
  } catch (error) {
    console.error('Error en GET /api/pedidos/tracking/:codigoOrId:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar tracking de la orden.'
    });
  }
});

/**
 * PATCH /api/pedidos/:id/estado
 * Actualizar estado logístico o guía de tracking desde el Panel Admin
 */
router.patch('/:id/estado', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, estado_pago, guia_tracking } = req.body;
    const numericId = isNaN(id) ? 0 : Number(id);

    await db.query(
      `UPDATE pedidos SET
        estado = COALESCE(?, estado),
        estado_pago = COALESCE(?, estado_pago),
        guia_tracking = COALESCE(?, guia_tracking)
      WHERE id = ? OR numero_orden = ?`,
      [estado || null, estado_pago || null, guia_tracking || null, numericId, id]
    );

    return res.json({
      success: true,
      message: 'Estado de la orden actualizado exitosamente en base de datos.'
    });
  } catch (error) {
    console.error('Error en PATCH /api/pedidos/:id/estado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del pedido.'
    });
  }
});

module.exports = router;

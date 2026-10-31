/**
 * MYCO CAUSAS v2 - Rutas de Cupones y Códigos de Descuento
 * Gestión administrativa y validación en tiempo real para clientes y carrito
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin, optionalAuth } = require('../middlewares/authMiddleware');

/**
 * GET /api/cupones
 * Obtiene todos los cupones registrados en la plataforma (Gestión Administrativa)
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {

    const [cupones] = await db.query(`
      SELECT 
        id,
        codigo,
        descripcion,
        tipo_descuento,
        valor_descuento,
        monto_minimo,
        limite_usos,
        veces_usado,
        DATE_FORMAT(fecha_expiracion, '%Y-%m-%d') AS fecha_expiracion,
        activo,
        creado_en
      FROM cupones
      ORDER BY id DESC
    `);

    return res.json({
      success: true,
      count: cupones.length,
      data: cupones
    });
  } catch (error) {
    console.error('Error al listar cupones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de cupones de descuento.'
    });
  }
});

/**
 * POST /api/cupones/validar
 * Valida un código de descuento ingresado por un cliente (público)
 */
router.post('/validar', async (req, res) => {
  try {
    const { codigo, subtotal = 0 } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un código de descuento válido.'
      });
    }

    const cleanCode = codigo.trim().toUpperCase();

    const [rows] = await db.query(
      `SELECT * FROM cupones WHERE UPPER(codigo) = ? LIMIT 1`,
      [cleanCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `El cupón "${cleanCode}" no existe o ha expirado.`
      });
    }

    const cupon = rows[0];

    // Verificar si está activo
    if (!cupon.activo) {
      return res.status(400).json({
        success: false,
        message: `El cupón "${cleanCode}" se encuentra actualmente inactivo.`
      });
    }

    // Verificar fecha de expiración
    if (cupon.fecha_expiracion) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const expDate = new Date(cupon.fecha_expiracion);
      expDate.setHours(0, 0, 0, 0);

      if (hoy > expDate) {
        return res.status(400).json({
          success: false,
          message: `El cupón "${cleanCode}" ha vencido.`
        });
      }
    }

    // Verificar límite de usos
    if (cupon.limite_usos !== null && cupon.veces_usado >= cupon.limite_usos) {
      return res.status(400).json({
        success: false,
        message: `El cupón "${cleanCode}" ha alcanzado el límite máximo de canjes permitidos.`
      });
    }

    const currentSubtotal = Number(subtotal) || 0;
    const montoMinimo = Number(cupon.monto_minimo) || 0;

    // Verificar monto mínimo de compra si el carrito tiene productos
    if (currentSubtotal > 0 && currentSubtotal < montoMinimo) {
      return res.status(400).json({
        success: false,
        message: `Este cupón requiere un monto mínimo de compra de S/ ${montoMinimo.toFixed(2)}. (Tu subtotal actual es S/ ${currentSubtotal.toFixed(2)})`
      });
    }

    // Calcular descuento
    let descuentoCalculado = 0;
    const valor = Number(cupon.valor_descuento);

    if (cupon.tipo_descuento === 'porcentaje') {
      descuentoCalculado = currentSubtotal > 0 ? (currentSubtotal * valor) / 100 : 0;
    } else {
      descuentoCalculado = valor;
    }

    const totalConDescuento = Math.max(0, currentSubtotal - descuentoCalculado);

    return res.json({
      success: true,
      message: `¡Cupón ${cleanCode} aplicado con éxito!`,
      data: {
        id: cupon.id,
        codigo: cupon.codigo,
        descripcion: cupon.descripcion,
        tipo_descuento: cupon.tipo_descuento,
        valor_descuento: valor,
        monto_minimo: montoMinimo,
        descuento: Number(descuentoCalculado.toFixed(2)),
        descuento_calculado: Number(descuentoCalculado.toFixed(2)),
        total_con_descuento: Number(totalConDescuento.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error al validar cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar el código de descuento.'
    });
  }
});

/**
 * POST /api/cupones
 * Crea un nuevo cupón de descuento en el sistema (Gestión Administrativa)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      codigo,
      descripcion,
      tipo_descuento = 'porcentaje',
      valor_descuento,
      monto_minimo = 0,
      limite_usos = null,
      fecha_expiracion = null,
      activo = 1
    } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del cupón es obligatorio.'
      });
    }

    if (!valor_descuento || Number(valor_descuento) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El valor del descuento debe ser mayor a 0.'
      });
    }

    const cleanCode = codigo.trim().toUpperCase();

    // Validar duplicado
    const [existente] = await db.query(
      `SELECT id FROM cupones WHERE UPPER(codigo) = ? LIMIT 1`,
      [cleanCode]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un cupón registrado con el código "${cleanCode}".`
      });
    }

    const [result] = await db.query(
      `INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, monto_minimo, limite_usos, fecha_expiracion, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCode,
        descripcion?.trim() || null,
        tipo_descuento === 'fijo' ? 'fijo' : 'porcentaje',
        Number(valor_descuento),
        Number(monto_minimo) || 0,
        limite_usos ? Number(limite_usos) : null,
        fecha_expiracion || null,
        activo ? 1 : 0
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Cupón "${cleanCode}" creado exitosamente.`,
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el cupón de descuento.'
    });
  }
});

/**
 * PUT /api/cupones/:id
 * Modifica un cupón existente (Gestión Administrativa)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      descripcion,
      tipo_descuento,
      valor_descuento,
      monto_minimo,
      limite_usos,
      fecha_expiracion,
      activo
    } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del cupón es obligatorio.'
      });
    }

    const cleanCode = codigo.trim().toUpperCase();

    // Verificar si otro cupón tiene el mismo código
    const [existente] = await db.query(
      `SELECT id FROM cupones WHERE UPPER(codigo) = ? AND id != ? LIMIT 1`,
      [cleanCode, id]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe otro cupón con el código "${cleanCode}".`
      });
    }

    await db.query(
      `UPDATE cupones 
       SET codigo = ?,
           descripcion = ?,
           tipo_descuento = ?,
           valor_descuento = ?,
           monto_minimo = ?,
           limite_usos = ?,
           fecha_expiracion = ?,
           activo = ?
       WHERE id = ?`,
      [
        cleanCode,
        descripcion?.trim() || null,
        tipo_descuento === 'fijo' ? 'fijo' : 'porcentaje',
        Number(valor_descuento),
        Number(monto_minimo) || 0,
        limite_usos ? Number(limite_usos) : null,
        fecha_expiracion || null,
        activo ? 1 : 0,
        id
      ]
    );

    return res.json({
      success: true,
      message: `Cupón "${cleanCode}" actualizado con éxito.`
    });
  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el cupón de descuento.'
    });
  }
});

/**
 * PATCH /api/cupones/:id/toggle
 * Activa o desactiva un cupón (Gestión Administrativa)
 */
router.patch('/:id/toggle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`SELECT activo FROM cupones WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    }

    const nuevoEstado = rows[0].activo ? 0 : 1;
    await db.query(`UPDATE cupones SET activo = ? WHERE id = ?`, [nuevoEstado, id]);

    return res.json({
      success: true,
      message: `Cupón ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
      activo: nuevoEstado
    });
  } catch (error) {
    console.error('Error al alternar estado de cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del cupón.'
    });
  }
});

/**
 * DELETE /api/cupones/:id
 * Elimina un cupón de la base de datos (Gestión Administrativa)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM cupones WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Cupón eliminado exitosamente.'
    });
  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el cupón.'
    });
  }
});

module.exports = router;

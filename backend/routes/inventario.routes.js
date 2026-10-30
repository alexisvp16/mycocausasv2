/**
 * MYCO CAUSAS v2 - Rutas de Inventario y Control de Calidad de Lotes
 * Trazabilidad de extractos, pureza HPLC y análisis COA
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

/**
 * GET /api/inventario/resumen
 * Resumen general de stock y alertas desde la vista SQL
 */
router.get('/resumen', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [resumen] = await db.query('SELECT * FROM v_resumen_inventario');
    return res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/resumen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar resumen de inventario.'
    });
  }
});

/**
 * GET /api/inventario/lotes
 * Lista completa de lotes biotecnológicos
 */
router.get('/lotes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.producto_id,
        p.nombre AS producto_nombre,
        p.nombre_cientifico,
        l.codigo_lote,
        l.unidades_iniciales,
        l.unidades_disponibles,
        l.umbral_alerta,
        l.pureza_hplc_pct,
        l.beta_glucanos_pct,
        l.fecha_extraccion,
        l.fecha_vencimiento,
        l.estado_coa,
        l.laboratorio,
        l.notas
      FROM lotes_inventario l
      INNER JOIN productos p ON l.producto_id = p.id
      ORDER BY l.id DESC
    `;

    const [lotes] = await db.query(query);

    return res.json({
      success: true,
      count: lotes.length,
      data: lotes
    });
  } catch (error) {
    console.error('Error en GET /api/inventario/lotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar lotes de inventario.'
    });
  }
});

/**
 * POST /api/inventario/lotes
 * Registrar un nuevo lote de extracción con certificado COA
 */
router.post('/lotes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      producto_id,
      codigo_lote,
      unidades_iniciales,
      unidades_disponibles,
      umbral_alerta,
      pureza_hplc_pct,
      beta_glucanos_pct,
      fecha_extraccion,
      fecha_vencimiento,
      estado_coa,
      laboratorio,
      notas
    } = req.body;

    if (!producto_id || !codigo_lote || !unidades_disponibles) {
      return res.status(400).json({
        success: false,
        message: 'Producto, código de lote y unidades son requeridos.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO lotes_inventario (
        producto_id, codigo_lote, unidades_iniciales, unidades_disponibles,
        umbral_alerta, pureza_hplc_pct, beta_glucanos_pct, fecha_extraccion,
        fecha_vencimiento, estado_coa, laboratorio, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        producto_id,
        codigo_lote.trim().toUpperCase(),
        unidades_iniciales || unidades_disponibles,
        unidades_disponibles,
        umbral_alerta || 15,
        pureza_hplc_pct || 98.00,
        beta_glucanos_pct || 35.00,
        fecha_extraccion || new Date(),
        fecha_vencimiento || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        estado_coa || 'Certificado',
        laboratorio || 'Laboratorio Myco Biotech Lima',
        notas || null
      ]
    );

    // Actualizar stock total del producto
    await db.query(
      'UPDATE productos SET stock_total = stock_total + ? WHERE id = ?',
      [unidades_disponibles, producto_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Lote registrado exitosamente.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error en POST /api/inventario/lotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar lote en inventario.'
    });
  }
});

/**
 * PUT /api/inventario/lotes/:id
 * Actualizar unidades o datos de un lote
 */
router.put('/lotes/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { unidades_disponibles, umbral_alerta, estado_coa, notas } = req.body;

    await db.query(
      `UPDATE lotes_inventario SET
        unidades_disponibles = COALESCE(?, unidades_disponibles),
        umbral_alerta = COALESCE(?, umbral_alerta),
        estado_coa = COALESCE(?, estado_coa),
        notas = COALESCE(?, notas)
      WHERE id = ?`,
      [unidades_disponibles, umbral_alerta, estado_coa, notas, id]
    );

    return res.json({
      success: true,
      message: 'Lote actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error en PUT /api/inventario/lotes/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar lote.'
    });
  }
});

module.exports = router;

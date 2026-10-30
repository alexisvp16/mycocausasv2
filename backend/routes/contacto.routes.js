/**
 * MYCO CAUSAS v2 - Rutas de Contacto y Consultas Científicas
 * Recibe consultas del formulario web y gestión de respuestas en el panel
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

/**
 * POST /api/contacto
 * Envío de mensaje desde el formulario web público (/contacto)
 */
router.post('/', async (req, res) => {
  try {
    const { nombre_completo, email, telefono, asunto, mensaje, tipo_consulta } = req.body;

    if (!nombre_completo || !email || !asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo electrónico, asunto y mensaje son campos requeridos.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO consultas_contacto (
        nombre_completo, email, telefono, asunto, mensaje, tipo_consulta, estado
      ) VALUES (?, ?, ?, ?, ?, ?, 'Nuevo')`,
      [
        nombre_completo.trim(),
        email.trim().toLowerCase(),
        telefono ? telefono.trim() : null,
        asunto.trim(),
        mensaje.trim(),
        tipo_consulta || 'general'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Tu consulta ha sido recibida por nuestro equipo científico. Nos pondremos en contacto a la brevedad.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error en POST /api/contacto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el mensaje de contacto.'
    });
  }
});

/**
 * GET /api/contacto
 * Listar mensajes de contacto recibidos (Solo Administradores)
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [consultas] = await db.query('SELECT * FROM consultas_contacto ORDER BY id DESC');
    return res.json({
      success: true,
      count: consultas.length,
      data: consultas
    });
  } catch (error) {
    console.error('Error en GET /api/contacto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar mensajes de contacto.'
    });
  }
});

/**
 * PATCH /api/contacto/:id
 * Actualizar estado o agregar notas internas (Solo Administradores)
 */
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas_internas } = req.body;

    await db.query(
      'UPDATE consultas_contacto SET estado = COALESCE(?, estado), notas_internas = COALESCE(?, notas_internas) WHERE id = ?',
      [estado, notas_internas, id]
    );

    return res.json({
      success: true,
      message: 'Consulta actualizada.'
    });
  } catch (error) {
    console.error('Error en PATCH /api/contacto/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar consulta.'
    });
  }
});

module.exports = router;

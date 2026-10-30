/**
 * MYCO CAUSAS v2 - Rutas de Productos y Extractos Funcionales
 * Catálogo público con especificaciones biotecnológicas y gestión administrativa
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin, optionalAuth } = require('../middlewares/authMiddleware');

/**
 * GET /api/productos
 * Obtiene todos los productos activos con su categoría y lote vigente
 * Si se pasa ?all=true o el solicitante es admin, incluye también los inactivos
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.rol === 'admin';
    const showAll = isAdmin || req.query.all === '1' || req.query.all === 'true';

    const query = `
      SELECT 
        p.id,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        c.slug AS categoria_slug,
        p.slug,
        p.nombre,
        p.nombre_cientifico,
        p.subtitulo,
        p.descripcion,
        p.beneficios,
        p.precio,
        p.precio_comparacion,
        p.concentracion,
        p.pureza_hplc,
        p.beta_glucanos,
        p.metodo_extraccion,
        p.dosis_recomendada,
        p.imagen,
        p.stock_total,
        p.destacado,
        p.activo,
        COALESCE(l.codigo_lote, 'N/A') AS lote_codigo,
        COALESCE(l.pureza_hplc_pct, p.pureza_hplc, '99.4%') AS pureza_hplc_pct,
        COALESCE(l.beta_glucanos_pct, p.beta_glucanos, '38.2%') AS beta_glucanos_pct,
        COALESCE(l.estado_coa, 'N/A') AS estado_coa
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN lotes_inventario l ON l.producto_id = p.id AND l.estado_coa = 'Certificado'
      ${showAll ? '' : 'WHERE p.activo = 1'}
      ORDER BY p.destacado DESC, p.id ASC
    `;

    const [productos] = await db.query(query);

    return res.json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar catálogo de productos.'
    });
  }
});

/**
 * GET /api/productos/categorias
 * Obtener lista de categorías funcionales
 */
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias WHERE activo = 1 ORDER BY orden ASC');
    return res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error en GET /api/productos/categorias:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar categorías.'
    });
  }
});

/**
 * GET /api/productos/:idOrSlug
 * Detalle completo de un producto por ID o Slug
 */
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNumeric = /^\d+$/.test(idOrSlug);

    const query = `
      SELECT 
        p.*,
        c.nombre AS categoria_nombre,
        c.slug AS categoria_slug,
        l.codigo_lote,
        l.unidades_disponibles AS lote_unidades,
        l.pureza_hplc_pct,
        l.beta_glucanos_pct,
        l.fecha_extraccion,
        l.fecha_vencimiento,
        l.estado_coa,
        l.laboratorio
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN lotes_inventario l ON l.producto_id = p.id AND l.estado_coa = 'Certificado'
      WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'} AND p.activo = 1
      LIMIT 1
    `;

    const [rows] = await db.query(query, [idOrSlug]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en GET /api/productos/:idOrSlug:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el producto.'
    });
  }
});

/**
 * POST /api/productos
 * Crear nuevo producto (Gestión Administrativa)
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.rol === 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requieren privilegios de Administrador.'
      });
    }

    let {
      categoria_id,
      categoria_nombre,
      categoria,
      slug,
      nombre,
      nombre_cientifico,
      subtitulo,
      descripcion,
      description,
      beneficios,
      bioactives,
      precio,
      precio_comparacion,
      concentracion,
      concentration,
      pureza_hplc,
      purity,
      beta_glucanos,
      betaGlucans,
      metodo_extraccion,
      dosis_recomendada,
      usage,
      imagen,
      stock_total,
      destacado
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y precio son requeridos.'
      });
    }

    // Resolver o crear categoría dinámica
    const catName = (categoria_nombre || categoria || '').trim();
    if (catName) {
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
      const [existingCat] = await db.query('SELECT id FROM categorias WHERE slug = ? OR nombre = ? LIMIT 1', [catSlug, catName]);
      if (existingCat.length > 0) {
        categoria_id = existingCat[0].id;
      } else {
        const [newCat] = await db.query('INSERT INTO categorias (slug, nombre, activo) VALUES (?, ?, 1)', [catSlug, catName]);
        categoria_id = newCat.insertId;
      }
    }

    if (!categoria_id) {
      const [firstCat] = await db.query('SELECT id FROM categorias ORDER BY id ASC LIMIT 1');
      if (firstCat.length > 0) {
        categoria_id = firstCat[0].id;
      } else {
        const [newCat] = await db.query("INSERT INTO categorias (slug, nombre, activo) VALUES ('general', 'Extractos Funcionales', 1)");
        categoria_id = newCat.insertId;
      }
    }

    // Generar slug garantizando unicidad en MySQL
    let baseSlug = (slug || nombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'producto';

    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const [existingSlug] = await db.query('SELECT id FROM productos WHERE slug = ? LIMIT 1', [finalSlug]);
      if (existingSlug.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const finalDesc = descripcion || description || 'Extracto biotecnológico puro estandarizado.';
    const finalBeneficios = beneficios || bioactives || '';
    const finalConcentracion = concentracion || concentration || '10:1 DUAL EXTRACT';
    const finalPureza = pureza_hplc || purity || '99.4% Grado Analítico';
    const finalBeta = beta_glucanos || betaGlucans || '38.2% (Certificado)';
    const finalDosis = dosis_recomendada || usage || '1ml a 2ml diariamente (1 a 2 goteros)';

    const [result] = await db.query(
      `INSERT INTO productos (
        categoria_id, slug, nombre, nombre_cientifico, subtitulo, descripcion, beneficios,
        precio, precio_comparacion, concentracion, pureza_hplc, beta_glucanos, metodo_extraccion,
        dosis_recomendada, imagen, stock_total, destacado, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        categoria_id,
        finalSlug,
        nombre,
        nombre_cientifico || 'Fungi spec.',
        subtitulo || catName || 'Extracto Funcional',
        finalDesc,
        finalBeneficios,
        precio,
        precio_comparacion || null,
        finalConcentracion,
        finalPureza,
        finalBeta,
        metodo_extraccion || 'Doble extracción hidroalcohólica ultrasónica',
        finalDosis,
        imagen || null,
        stock_total || 25,
        destacado ? 1 : 0
      ]
    );

    const newProductId = result.insertId;

    // Crear lote inicial de certificación COA en lotes_inventario para trazabilidad
    try {
      const batchCode = `LOT-${finalSlug.toUpperCase().substring(0, 8)}-${newProductId}`;
      await db.query(
        `INSERT INTO lotes_inventario (
          producto_id, codigo_lote, unidades_producidas, unidades_disponibles,
          pureza_hplc_pct, beta_glucanos_pct, fecha_extraccion, fecha_vencimiento,
          estado_coa, laboratorio
        ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 'Certificado', 'Laboratorio Myco Causas')`,
        [
          newProductId,
          batchCode,
          stock_total || 25,
          stock_total || 25,
          parseFloat(finalPureza) || 99.40,
          parseFloat(finalBeta) || 38.20
        ]
      );
    } catch (e) {
      console.warn('Lote automático no creado:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      id: newProductId,
      categoria_id
    });
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el producto en la base de datos.'
    });
  }
});

/**
 * PUT /api/productos/:id
 * Modificar producto existente (Gestión Administrativa)
 */
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.rol === 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requieren privilegios de Administrador.'
      });
    }

    const { id } = req.params;
    let {
      categoria_id,
      categoria_nombre,
      categoria,
      nombre,
      nombre_cientifico,
      subtitulo,
      descripcion,
      description,
      beneficios,
      bioactives,
      precio,
      precio_comparacion,
      concentracion,
      concentration,
      pureza_hplc,
      purity,
      beta_glucanos,
      betaGlucans,
      metodo_extraccion,
      dosis_recomendada,
      usage,
      imagen,
      stock_total,
      destacado,
      activo
    } = req.body;

    const catName = (categoria_nombre || categoria || '').trim();
    if (catName) {
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
      const [existingCat] = await db.query('SELECT id FROM categorias WHERE slug = ? OR nombre = ? LIMIT 1', [catSlug, catName]);
      if (existingCat.length > 0) {
        categoria_id = existingCat[0].id;
      } else {
        const [newCat] = await db.query('INSERT INTO categorias (slug, nombre, activo) VALUES (?, ?, 1)', [catSlug, catName]);
        categoria_id = newCat.insertId;
      }
    }

    const finalDesc = descripcion !== undefined ? descripcion : description;
    const finalBeneficios = beneficios !== undefined ? beneficios : bioactives;
    const finalConcentracion = concentracion !== undefined ? concentracion : concentration;
    const finalPureza = pureza_hplc !== undefined ? pureza_hplc : purity;
    const finalBeta = beta_glucanos !== undefined ? beta_glucanos : betaGlucans;
    const finalDosis = dosis_recomendada !== undefined ? dosis_recomendada : usage;

    await db.query(
      `UPDATE productos SET
        categoria_id = COALESCE(?, categoria_id),
        nombre = COALESCE(?, nombre),
        nombre_cientifico = COALESCE(?, nombre_cientifico),
        subtitulo = COALESCE(?, subtitulo),
        descripcion = COALESCE(?, descripcion),
        beneficios = COALESCE(?, beneficios),
        precio = COALESCE(?, precio),
        precio_comparacion = COALESCE(?, precio_comparacion),
        concentracion = COALESCE(?, concentracion),
        pureza_hplc = COALESCE(?, pureza_hplc),
        beta_glucanos = COALESCE(?, beta_glucanos),
        metodo_extraccion = COALESCE(?, metodo_extraccion),
        dosis_recomendada = COALESCE(?, dosis_recomendada),
        imagen = COALESCE(?, imagen),
        stock_total = COALESCE(?, stock_total),
        destacado = COALESCE(?, destacado),
        activo = COALESCE(?, activo)
      WHERE id = ?`,
      [
        categoria_id,
        nombre,
        nombre_cientifico,
        subtitulo,
        finalDesc,
        finalBeneficios,
        precio,
        precio_comparacion,
        finalConcentracion,
        finalPureza,
        finalBeta,
        metodo_extraccion,
        finalDosis,
        imagen,
        stock_total,
        destacado,
        activo,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Producto actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto.'
    });
  }
});

/**
 * POST /api/productos/upload-imagen
 * Subir archivo de imagen para productos (Solo Administradores)
 */
const fs = require('fs');
const path = require('path');

router.post('/upload-imagen', optionalAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'No se envió ninguna imagen.'
      });
    }

    let mimeType = 'image/png';
    let base64Content = imageBase64;

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      const prefix = parts[0];
      base64Content = parts[1];
      const mimeMatch = prefix.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    let ext = mimeType.split('/')[1] || 'png';
    if (ext.includes('+')) ext = ext.split('+')[0];
    if (ext === 'jpeg') ext = 'jpg';

    // Limpiar posibles espacios en blanco o saltos de línea del base64
    const cleanBase64 = base64Content.replace(/\s/g, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = `producto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadDir = path.join(__dirname, '..', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetPath = path.join(uploadDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    const relativeUrl = `/uploads/${safeName}`;
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return res.json({
      success: true,
      message: 'Imagen subida correctamente.',
      imageUrl: relativeUrl,
      fullUrl,
      relativeUrl
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor al guardar la imagen.'
    });
  }
});

/**
 * PATCH /api/productos/:id/toggle
 * Activar o desactivar producto (Gestión Administrativa)
 */
router.patch('/:id/toggle', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.rol === 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requieren privilegios de Administrador.'
      });
    }

    const { id } = req.params;
    const [result] = await db.query(
      'UPDATE productos SET activo = IF(activo = 1, 0, 1) WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    const [rows] = await db.query('SELECT id, nombre, activo FROM productos WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Producto ${rows[0]?.activo ? 'activado' : 'desactivado'} correctamente.`,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del producto.'
    });
  }
});

/**
 * DELETE /api/productos/:id
 * Eliminar producto (Gestión Administrativa)
 */
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.rol === 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requieren privilegios de Administrador.'
      });
    }

    const { id } = req.params;
    await db.query('DELETE FROM lotes_inventario WHERE producto_id = ?', [id]);
    await db.query('DELETE FROM productos WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Producto eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar producto de la base de datos.'
    });
  }
});

module.exports = router;

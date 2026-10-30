/**
 * =============================================================================
 * MYCO CAUSAS v2 - SERVIDOR BACKEND (EXPRESS.JS + MYSQL 8)
 * API REST de Alto Rendimiento para Plataforma Biotecnológica
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');

// Importación de módulos de rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const contactoRoutes = require('./routes/contacto.routes');
const adminRoutes = require('./routes/admin.routes');
const cuponesRoutes = require('./routes/cupones.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// MIDDLEWARES GENERALES Y DE SEGURIDAD
// =============================================================================

// Configuración CORS permisiva para desarrollo y estricta en producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (comprobantes de pago e imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================================================
// RUTAS DE DIAGNÓSTICO Y SALUD DEL SERVIDOR
// =============================================================================

app.get('/', (req, res) => {
  res.json({
    proyecto: 'Myco Causas v2 API',
    estado: 'Operativo',
    version: '2.0.0',
    motor: 'Node.js + Express + MySQL 8.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const [resultado] = await db.query('SELECT 1 AS conectado, NOW() AS fecha_db');
    res.json({
      estado_servidor: 'OK',
      base_de_datos: 'Conectada exitosamente',
      diagnostico: resultado[0]
    });
  } catch (error) {
    console.error('Error de diagnóstico con MySQL:', error.message);
    res.status(500).json({
      estado_servidor: 'ERROR',
      base_de_datos: 'No se pudo contactar MySQL',
      detalle: error.message
    });
  }
});

// =============================================================================
// REGISTRO DE RUTAS DE LA API
// =============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cupones', cuponesRoutes);

// Compatibilidad con rutas legacy si el frontend anterior las llamaba directamente
app.use('/api/usuarios', authRoutes);

// =============================================================================
// SERVIR FRONTEND SPA EN PRODUCCIÓN (FALLBACK DIRECTO)
// Permite que la aplicación funcione en AWS con o sin Nginx inverso
// =============================================================================

const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// =============================================================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// =============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
  });
});

// =============================================================================
// MANEJO GLOBAL DE ERRORES DEL SERVIDOR
// =============================================================================

app.use((error, req, res, _next) => {
  console.error('⚠️ Error no capturado en servidor:', error);
  if (res.headersSent) {
    return;
  }
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor.'
  });
});

// =============================================================================
// INICIAR ESCUCHA DEL SERVIDOR
// =============================================================================

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🧬 MYCO CAUSAS v2 — SERVIDOR BACKEND ACTIVO`);
  console.log(`🚀 URL Base: http://localhost:${PORT}`);
  console.log(`🩺 Diagnóstico: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

module.exports = { app, server };

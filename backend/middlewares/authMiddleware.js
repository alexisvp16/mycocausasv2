/**
 * MYCO CAUSAS v2 - Middlewares de Autenticación y Autorización
 * Verificación estricta de JSON Web Tokens (JWT) y control de roles
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Valida la presencia y vigencia del JWT en el encabezado Authorization
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: Token de sesión ausente o malformado.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'myco_causas_super_secret_jwt_key_2026_alexis';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.'
      });
    }

    // Comprobar que el usuario sigue existiendo y está activo en la base de datos
    const [rows] = await db.query(
      'SELECT id, nombre, email, telefono, rol, activo FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'El usuario asociado a esta sesión ya no existe.'
      });
    }

    const user = rows[0];
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada. Comunícate con soporte.'
      });
    }

    // Inyectar usuario en la petición
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en verifyToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en la validación de credenciales.'
    });
  }
};

/**
 * Exige que el usuario autenticado tenga rol de 'admin'
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren privilegios de Administrador.'
    });
  }
  next();
};

/**
 * Middleware opcional: si hay token lo valida, sino continúa como invitado
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'myco_causas_super_secret_jwt_key_2026_alexis';
    const decoded = jwt.verify(token, secret);
    const [rows] = await db.query(
      'SELECT id, nombre, email, telefono, rol, activo FROM usuarios WHERE id = ?',
      [decoded.id]
    );
    if (rows.length > 0 && rows[0].activo) {
      req.user = rows[0];
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth
};

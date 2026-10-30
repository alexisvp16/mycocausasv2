/**
 * MYCO CAUSAS v2 - Rutas de Autenticación y Seguridad
 * Control de inicio de sesión con Bcrypt, emisión de JWT y bloqueo anti-fuerza bruta
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'myco_causas_super_secret_jwt_key_2026_alexis';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Registra un evento en la tabla de auditoría de seguridad
 */
async function registrarAuditoria(usuarioId, evento, req, detalles) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconocido';
    await db.query(
      'INSERT INTO auditoria_seguridad (usuario_id, evento, ip_origen, user_agent, detalles) VALUES (?, ?, ?, ?, ?)',
      [usuarioId, evento, ip, userAgent.substring(0, 255), detalles]
    );
  } catch (err) {
    console.error('Error al registrar auditoría:', err.message);
  }
}

/**
 * POST /api/auth/login
 * Iniciar sesión con email y contraseña
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar correo electrónico y contraseña.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Buscar usuario por email
    const [users] = await db.query(
      'SELECT id, nombre, email, telefono, password_hash, rol, activo, intentos_fallidos, bloqueado_hasta, ultimo_acceso FROM usuarios WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      await registrarAuditoria(null, 'LOGIN_FALLIDO', req, `Intento con correo inexistente: ${cleanEmail}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifica tu correo o contraseña.'
      });
    }

    const user = users[0];

    // 2. Comprobar si la cuenta está inactiva
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada. Comunícate con la administración.'
      });
    }

    // 3. Comprobar bloqueo temporal por fuerza bruta
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const minutosRestantes = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / (1000 * 60));
      await registrarAuditoria(user.id, 'INTENTO_BLOQUEADO', req, `Intento durante bloqueo activo (${minutosRestantes} min restantes)`);
      return res.status(429).json({
        success: false,
        message: `Cuenta bloqueada preventivamente por exceso de intentos. Reintenta en ${minutosRestantes} minuto(s).`
      });
    }

    // 4. Comparar contraseña con Bcrypt
    let isMatch = false;
    if (user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Compatibilidad con contraseñas heredadas en texto plano (se actualizan automáticamente a Bcrypt)
      isMatch = password === user.password_hash;
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, user.id]);
      }
    }

    if (!isMatch) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      let bloqueo = null;
      if (nuevosIntentos >= 5) {
        bloqueo = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de bloqueo
      }

      await db.query(
        'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?',
        [nuevosIntentos, bloqueo, user.id]
      );

      await registrarAuditoria(user.id, 'LOGIN_FALLIDO', req, `Contraseña incorrecta (Intento ${nuevosIntentos}/5)`);

      if (nuevosIntentos >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Has superado el límite de 5 intentos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos.'
        });
      }

      return res.status(401).json({
        success: false,
        message: `Contraseña incorrecta. Te quedan ${5 - nuevosIntentos} intentos antes del bloqueo.`
      });
    }

    // 5. Login exitoso: restablecer contadores de seguridad y actualizar último acceso
    await db.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    // 6. Generar JWT
    const tokenPayload = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await registrarAuditoria(user.id, 'LOGIN_EXITOSO', req, `Sesión iniciada con rol ${user.rol}`);

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        ultimo_acceso: new Date()
      },
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          rol: user.rol,
          ultimo_acceso: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión.'
    });
  }
});

/**
 * POST /api/auth/register
 * Registro de nuevos clientes
 */
const handleRegister = async (req, res) => {
  try {
    const { nombre, name, email, telefono, phone, password } = req.body;
    const finalNombre = (nombre || name || '').trim();
    const finalPhone = (telefono || phone || '').trim() || null;

    if (!finalNombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo electrónico y contraseña son obligatorios.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener un mínimo de 6 caracteres.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Comprobar si ya existe
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ingresado ya se encuentra registrado.'
      });
    }

    // Hashear contraseña con Bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, telefono, password_hash, rol, activo, email_verificado) VALUES (?, ?, ?, ?, "cliente", 1, 0)',
      [finalNombre, cleanEmail, finalPhone, passwordHash]
    );

    const newUserId = result.insertId;
    await registrarAuditoria(newUserId, 'REGISTRO_CLIENTE', req, 'Registro completado desde plataforma web');

    // Generar token para autologin
    const token = jwt.sign(
      { id: newUserId, nombre: finalNombre, email: cleanEmail, rol: 'cliente' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente.',
      token,
      user: {
        id: newUserId,
        nombre: finalNombre,
        email: cleanEmail,
        telefono: finalPhone,
        rol: 'cliente'
      },
      data: {
        token,
        user: {
          id: newUserId,
          nombre: finalNombre,
          email: cleanEmail,
          telefono: finalPhone,
          rol: 'cliente'
        }
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el registro.'
    });
  }
};

router.post('/register', handleRegister);
router.post('/registro', handleRegister);
router.post('/', handleRegister);

/**
 * GET /api/auth/me
 * Obtener perfil de la sesión actual
 */
router.get('/me', verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;

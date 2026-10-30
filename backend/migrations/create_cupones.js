const db = require('../config/db');

async function runMigration() {
  try {
    console.log('Iniciando migración de cupones...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS cupones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NULL,
        tipo_descuento ENUM('porcentaje', 'fijo') NOT NULL DEFAULT 'porcentaje',
        valor_descuento DECIMAL(10,2) NOT NULL,
        monto_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        limite_usos INT NULL DEFAULT NULL,
        veces_usado INT NOT NULL DEFAULT 0,
        fecha_expiracion DATE NULL DEFAULT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Tabla `cupones` creada correctamente.');

    await db.query(`
      INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, monto_minimo, limite_usos, fecha_expiracion, activo)
      VALUES ('MYCO10', '10% de descuento de bienvenida en tu orden', 'porcentaje', 10.00, 0.00, 100, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1)
      ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
    `);
    console.log('✓ Cupón inicial MYCO10 creado.');

    const [rows] = await db.query('SELECT * FROM cupones');
    console.log('Cupones actuales en BD:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}

runMigration();

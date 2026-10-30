/**
 * MYCO CAUSAS v2 - Pool de Conexión a Base de Datos MySQL
 * Utiliza mysql2/promise para transacciones y consultas asíncronas seguras.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'alexisvela123',
  database: process.env.DB_NAME || 'myco_causas_v2',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Función para comprobar conectividad inicial
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conexión exitosa a MySQL (Base de datos: ' + (process.env.DB_NAME || 'myco_causas_v2') + ')');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error crítico al conectar con MySQL:', err.message);
  });

module.exports = pool;

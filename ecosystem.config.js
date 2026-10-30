/**
 * =============================================================================
 * MYCO CAUSAS v2 — ARCHIVO DE CONFIGURACIÓN PM2 PARA AWS
 * Administrador de procesos Node.js de producción con autorestart y monitoreo
 * =============================================================================
 * Uso en servidor AWS:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'myco-causas-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1, // Puedes cambiar a 'max' para modo cluster en servidores multinúcleo
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

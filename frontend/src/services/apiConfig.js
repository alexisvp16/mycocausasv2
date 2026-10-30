/**
 * MYCO CAUSAS // CONFIGURACIÓN CENTRALIZADA DE API
 * Detecta automáticamente si se ejecuta en localhost o en servidor remoto (AWS / Dominio)
 * para evitar problemas de CORS y llamadas a IPs rígidas.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:5000/api');

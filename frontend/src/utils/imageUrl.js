/**
 * MYCO CAUSAS // RESOLUCIÓN DE IMÁGENES
 * Asegura que las imágenes subidas al backend (puerto 5000) o en base64
 * se visualicen correctamente en cualquier pantalla del frontend.
 */

import { API_BASE_URL } from '../services/apiConfig';

const BACKEND_HOST = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api\/?$/, '')
  : '';

export function formatImageUrl(url) {
  if (!url) return '';
  
  const trimmed = String(url).trim();
  
  // Base64 o blobs locales (previsualización en vivo instantánea)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  
  // Limpiar posibles URLs con localhost:5000 guardadas en producción
  if (trimmed.includes('localhost:5000/uploads/')) {
    const rel = trimmed.substring(trimmed.indexOf('/uploads/'));
    return BACKEND_HOST ? `${BACKEND_HOST}${rel}` : rel;
  }

  // URLs absolutas externas o completas
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Archivos subidos al backend (/uploads/...)
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return BACKEND_HOST ? `${BACKEND_HOST}${cleanPath}` : cleanPath;
  }
  
  // Archivos estáticos locales del frontend (/logo.png, etc.)
  return trimmed;
}

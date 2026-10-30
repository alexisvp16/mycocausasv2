/**
 * MYCO CAUSAS // RESOLUCIÓN DE IMÁGENES
 * Asegura que las imágenes subidas al backend (puerto 5000) o en base64
 * se visualicen correctamente en cualquier pantalla del frontend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_HOST = API_URL.startsWith('http')
  ? API_URL.replace(/\/api\/?$/, '')
  : '';

export function formatImageUrl(url) {
  if (!url) return '';
  
  const trimmed = String(url).trim();
  
  // Base64 o blobs locales (previsualización en vivo instantánea)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  
  // URLs absolutas externas o completas
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Archivos subidos al backend (/uploads/...)
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${BACKEND_HOST}${cleanPath}`;
  }
  
  // Archivos estáticos locales del frontend (/logo.png, etc.)
  return trimmed;
}

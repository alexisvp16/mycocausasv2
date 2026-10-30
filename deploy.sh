#!/bin/bash
# =============================================================================
# MYCO CAUSAS v2 — SCRIPT DE DESPLIEGUE CONTINUO EN AWS (EC2 / LIGHTSAIL)
# =============================================================================
# Uso en tu servidor Linux:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -e

echo "🚀 [1/5] Iniciando despliegue de Myco Causas v2..."

# 1. Obtener última versión del código
if [ -d ".git" ]; then
  echo "📥 [2/5] Actualizando repositorio Git..."
  git pull origin main
else
  echo "ℹ️ [2/5] No se detectó repositorio Git, continuando con archivos locales..."
fi

# 2. Instalar dependencias del Backend
echo "📦 [3/5] Instalando dependencias de producción del backend..."
cd backend
npm install --omit=dev
cd ..

# 3. Compilar el Frontend para producción
echo "⚡ [4/5] Compilando frontend para producción con Vite..."
cd frontend
npm install
npm run build
cd ..

# 4. Asegurar directorios de logs y uploads
mkdir -p logs
mkdir -p backend/uploads

# 5. Reiniciar procesos con PM2
echo "🔄 [5/5] Reiniciando servicio Node.js con PM2..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
  pm2 save
  echo "✅ ¡Despliegue completado con éxito! Monitorea con: pm2 status"
else
  echo "⚠️ PM2 no está instalado globalmente. Ejecuta: sudo npm install -g pm2"
fi

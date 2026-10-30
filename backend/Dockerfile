# =============================================================================
# MYCO CAUSAS v2 — BACKEND DOCKERFILE PARA PRODUCCIÓN
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar dependencias del sistema mínimas
RUN apk add --no-cache tzdata

ENV NODE_ENV=production
ENV PORT=5000

# Copiar manifiestos e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código fuente del backend
COPY . .

# Crear carpeta de uploads si no existe y asegurar permisos
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]

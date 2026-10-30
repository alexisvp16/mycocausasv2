# =============================================================================
# MYCO CAUSAS v2 — FRONTEND DOCKERFILE MULTI-STAGE
# =============================================================================

# --- ETAPA 1: Construcción de assets con Vite ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Argumento para URL de API en tiempo de build (por defecto relativa /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- ETAPA 2: Servidor Web Nginx ultraligero ---
FROM nginx:alpine AS runner

# Copiar configuración de Nginx optimizada para SPA
COPY ./nginx-docker.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

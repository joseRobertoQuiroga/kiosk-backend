# ═══════════════════════════════════════════════════════════════
# 🚀 DOCKERFILE PARA API NESTJS - KIOSKO SYSTEM
# ═══════════════════════════════════════════════════════════════

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Verificar estructura y construir
RUN ls -la && \
    npm run build && \
    ls -la dist/

# ═══════════════════════════════════════════════════════════════
# Etapa 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production && npm cache clean --force

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

# Crear directorio para imágenes
RUN mkdir -p /app/public/imagenes

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto (se sobreescriben con docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio - buscar el archivo principal
CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js || node dist/main"]
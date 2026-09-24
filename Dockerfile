# ===================================================
# FASE 1: Construcción (Builder)
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar herramientas para compilar módulos nativos como better-sqlite3
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de dependencias
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar todas las dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar frontend PWA y backend TypeScript
RUN npm run build

# ===================================================
# FASE 2: Imagen Final Ligera de Producción (Runner)
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Dependencias para SQLite en tiempo de ejecución
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/tasks.db

# Copiar manifiestos y dependencias de producción
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar compilación del servidor y de la PWA cliente
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Crear directorio para persistencia de la base de datos SQLite
RUN mkdir -p /app/data && chown -R node:node /app

USER node

# Volumen para persistencia de datos (tareas, turnos y usuarios)
VOLUME ["/app/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server/dist/index.js"]

import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDatabase, db } from './db';
import { authRouter } from './routes/authRoutes';
import { taskRouter } from './routes/taskRoutes';
import { calendarRouter } from './routes/calendarRoutes';
import { backupRouter } from './routes/backupRoutes';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Detrás del túnel de Cloudflare: confiar en el proxy para obtener la IP real del cliente
app.set('trust proxy', 1);

// Inicializar base de datos SQLite
initDatabase();

// Middlewares de seguridad y parsing
app.use(
  helmet({
    contentSecurityPolicy: false, // Permitir fuentes Google Fonts y PWA Service Workers
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Límite de intentos en autenticación para frenar la fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/setup', authLimiter);

// Rutas de API
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/backup', backupRouter);

// Ruta de comprobación de salud para Docker / VPS
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// En producción: Servir la aplicación PWA compilada de client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback SPA: Cualquier ruta que no sea /api/* entrega el index.html de la PWA
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Tareas Metatron Server</title>
          <style>
            body { font-family: sans-serif; background: #00205B; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Tareas Metatron Backend Activo</h1>
            <p>El servidor API está funcionando. Compila el cliente PWA con <code>npm run build:client</code>.</p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`[Tareas Metatron] Servidor iniciado con éxito en http://localhost:${PORT}`);
});

// Apagado limpio cerrando SQLite
function gracefulShutdown() {
  console.log('[Tareas Metatron] Cerrando servidor y conexiones SQLite...');
  server.close(() => {
    db.close();
    console.log('[Tareas Metatron] Conexión SQLite cerrada con éxito.');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

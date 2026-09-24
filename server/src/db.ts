import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Determinar ruta de la base de datos (variable de entorno o carpeta data local)
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db');
const dbDir = path.dirname(dbPath);

// Asegurar que el directorio de datos existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Inicializar conexión SQLite con WAL mode para alta concurrencia y velocidad
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Tabla de usuarios / familiares
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', -- 'admin' o 'member'
      color TEXT NOT NULL DEFAULT '#00205B',
      avatar TEXT NOT NULL DEFAULT '👤',
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de tareas (personales y compartidas)
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      is_shared INTEGER NOT NULL DEFAULT 0, -- 0: Personal (privada), 1: Compartida
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'media', -- 'baja', 'media', 'alta', 'urgente'
      due_date TEXT, -- YYYY-MM-DD para vincular al calendario
      due_time TEXT, -- HH:MM opcional
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_by INTEGER,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Tabla de asignación / compartición de tareas
    CREATE TABLE IF NOT EXISTS task_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL, -- Usuario con quien se comparte (o 0 para toda la familia)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(task_id, user_id)
    );

    -- Tabla de turnos de trabajo y disponibilidad en el calendario (ej: Turno 2x2 de la esposa)
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- Formato YYYY-MM-DD
      type TEXT NOT NULL DEFAULT 'work_shift', -- 'work_shift', 'off', 'event'
      title TEXT NOT NULL, -- ej: 'Turno 2x2 (Trabajo)', 'No está en casa'
      color TEXT NOT NULL, -- Color distintivo del familiar
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tabla de configuración del sistema
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Índices para búsqueda rápida y calendario
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, is_shared, is_completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(date);
    CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id, date);
  `);

  console.log(`[DB] Base de datos SQLite lista en: ${dbPath}`);
}

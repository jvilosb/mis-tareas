import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

export const backupRouter = Router();

backupRouter.use(requireAuth);

// 1. Exportar datos completos en formato JSON
backupRouter.get('/export', (_req, res) => {
  const users = db.prepare('SELECT id, username, name, role, color, avatar, created_at FROM users').all();
  const tasks = db.prepare('SELECT * FROM tasks').all();
  const taskShares = db.prepare('SELECT * FROM task_shares').all();
  const calendarEvents = db.prepare('SELECT * FROM calendar_events').all();

  const backupData = {
    app: 'RamTask',
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    users,
    tasks,
    task_shares: taskShares,
    calendar_events: calendarEvents,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ramtask_backup_${new Date().toISOString().split('T')[0]}.json`);
  return res.json(backupData);
});

// 2. Importar datos desde un archivo JSON de respaldo
backupRouter.post('/import', (req: AuthenticatedRequest, res) => {
  // Solo administradores pueden restaurar respaldos
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo un administrador puede restaurar copias de seguridad.' });
  }

  const { tasks, calendar_events } = req.body;

  if (!Array.isArray(tasks) && !Array.isArray(calendar_events)) {
    return res.status(400).json({ error: 'Formato de respaldo JSON no válido.' });
  }

  const tx = db.transaction(() => {
    // Restaurar tareas si se proporcionaron
    if (Array.isArray(tasks)) {
      const taskInsert = db.prepare(`
        INSERT OR REPLACE INTO tasks (id, user_id, is_shared, title, description, priority, due_date, due_time, is_completed, completed_by, completed_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of tasks) {
        taskInsert.run(
          t.id,
          t.user_id || req.user!.id,
          t.is_shared || 0,
          t.title,
          t.description || null,
          t.priority || 'media',
          t.due_date || null,
          t.due_time || null,
          t.is_completed || 0,
          t.completed_by || null,
          t.completed_at || null,
          t.created_at || new Date().toISOString(),
          t.updated_at || new Date().toISOString()
        );
      }
    }

    // Restaurar eventos de calendario
    if (Array.isArray(calendar_events)) {
      const eventInsert = db.prepare(`
        INSERT OR REPLACE INTO calendar_events (id, user_id, date, type, title, color, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of calendar_events) {
        eventInsert.run(
          e.id,
          e.user_id || req.user!.id,
          e.date,
          e.type || 'work_shift',
          e.title || 'Turno',
          e.color || '#e11d48',
          e.notes || null,
          e.created_at || new Date().toISOString()
        );
      }
    }
  });

  try {
    tx();
    return res.json({ success: true, message: 'Datos restaurados correctamente.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al restaurar los datos.' });
  }
});

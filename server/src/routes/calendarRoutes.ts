import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

export const calendarRouter = Router();

calendarRouter.use(requireAuth);

// 1. Obtener eventos, turnos y tareas compartidas de un mes específico
calendarRouter.get('/month', (req: AuthenticatedRequest, res) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const year = req.query.year ? Number(req.query.year) : currentYear;
  const month = req.query.month ? Number(req.query.month) : currentMonth;

  // Formato para SQLite: YYYY-MM%
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // 1. Consultar turnos de trabajo y eventos del mes
  const shifts = db.prepare(`
    SELECT ce.*, u.name as user_name, u.color as user_color, u.avatar as user_avatar
    FROM calendar_events ce
    JOIN users u ON ce.user_id = u.id
    WHERE ce.date LIKE ?
    ORDER BY ce.date ASC, ce.id ASC
  `).all(`${monthStr}-%`);

  // 2. Consultar tareas compartidas que vencen en este mes
  const sharedTasks = db.prepare(`
    SELECT t.id, t.title, t.priority, t.due_date, t.due_time, t.is_completed,
           u.name as creator_name, u.color as creator_color, u.avatar as creator_avatar
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.is_shared = 1 AND t.due_date LIKE ?
    ORDER BY t.due_date ASC, t.is_completed ASC
  `).all(`${monthStr}-%`);

  return res.json({
    year,
    month,
    shifts,
    sharedTasks,
  });
});

// 2. Alternar o registrar un turno de trabajo / evento en una fecha específica
calendarRouter.post('/shift', (req: AuthenticatedRequest, res) => {
  const targetUserId = req.body.user_id ? Number(req.body.user_id) : req.user!.id;
  const { date, title, color, type, notes } = req.body;

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: 'La fecha debe estar en formato YYYY-MM-DD.' });
  }

  // Obtener color del usuario si no se especifica
  const user = db.prepare('SELECT color, name FROM users WHERE id = ?').get(targetUserId) as any;
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const shiftColor = color || user.color || '#e11d48';
  const shiftTitle = title && title.trim() ? title.trim() : `Turno ${user.name}`;
  const shiftType = type || 'work_shift';

  // Verificar si ya tiene un turno en esa fecha exacta para alternar (toggle) o actualizar
  const existing = db.prepare('SELECT id FROM calendar_events WHERE user_id = ? AND date = ?').get(targetUserId, date) as any;

  if (existing) {
    // Si ya existía, eliminarlo (toggle off)
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(existing.id);
    return res.json({ action: 'deleted', id: existing.id, date });
  }

  // Si no existía, insertarlo
  const result = db.prepare(`
    INSERT INTO calendar_events (user_id, date, type, title, color, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(targetUserId, date, shiftType, shiftTitle, shiftColor, notes || null);

  const created = db.prepare(`
    SELECT ce.*, u.name as user_name, u.color as user_color, u.avatar as user_avatar
    FROM calendar_events ce
    JOIN users u ON ce.user_id = u.id
    WHERE ce.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json({ action: 'created', shift: created });
});

// 3. Generador automático de turnos 2x2 (o N x M)
// Ideal para cuando la esposa trabaja 2 días seguidos y descansa 2
calendarRouter.post('/shift/batch-2x2', (req: AuthenticatedRequest, res) => {
  const targetUserId = req.body.user_id ? Number(req.body.user_id) : req.user!.id;
  const { start_date, days_count, work_days = 2, rest_days = 2, title } = req.body;

  if (!start_date || !start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: 'Fecha de inicio requerida en formato YYYY-MM-DD.' });
  }

  const user = db.prepare('SELECT color, name FROM users WHERE id = ?').get(targetUserId) as any;
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const totalDays = Math.min(Number(days_count) || 60, 120); // Máximo 4 meses a la vez
  const shiftTitle = title || `Turno Trabajo (2x2)`;
  const shiftColor = user.color || '#e11d48';

  const startDateObj = new Date(`${start_date}T00:00:00`);
  const cycleLength = work_days + rest_days;
  const createdShifts: string[] = [];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO calendar_events (user_id, date, type, title, color)
    VALUES (?, ?, 'work_shift', ?, ?)
  `);

  const deleteExistingStmt = db.prepare(`
    DELETE FROM calendar_events WHERE user_id = ? AND date = ?
  `);

  const tx = db.transaction(() => {
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayInCycle = i % cycleLength;
      if (dayInCycle < work_days) {
        // Es día de trabajo: insertar turno
        insertStmt.run(targetUserId, dateStr, shiftTitle, shiftColor);
        createdShifts.push(dateStr);
      } else {
        // Es día de descanso: limpiar si había turno previo para evitar conflictos
        deleteExistingStmt.run(targetUserId, dateStr);
      }
    }
  });

  tx();

  return res.json({
    success: true,
    message: `Se generaron ${createdShifts.length} días de turno con el patrón ${work_days}x${rest_days}.`,
    created_dates: createdShifts,
  });
});

// 4. Eliminar un turno específico por ID
calendarRouter.delete('/shift/:id', (req: AuthenticatedRequest, res) => {
  const shiftId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(shiftId) as any;

  if (!existing) {
    return res.status(404).json({ error: 'Turno no encontrado.' });
  }

  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(shiftId);
  return res.json({ success: true, id: shiftId });
});

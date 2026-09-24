import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

export const taskRouter = Router();

// Middleware: todas las rutas de tareas requieren sesión activa
taskRouter.use(requireAuth);

// 1. Obtener TAREAS PERSONALES (100% privadas para el usuario autenticado)
taskRouter.get('/personal', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const statusFilter = req.query.status as string; // 'pending', 'completed', o 'all'
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;

  let query = `
    SELECT t.*, u.name as creator_name, u.color as creator_color, u.avatar as creator_avatar
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.is_shared = 0 AND t.user_id = ?
  `;
  const params: any[] = [userId];

  if (statusFilter === 'pending') {
    query += ' AND t.is_completed = 0';
  } else if (statusFilter === 'completed') {
    query += ' AND t.is_completed = 1';
  }

  if (search) {
    query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    params.push(search, search);
  }

  query += ' ORDER BY t.is_completed ASC, CASE t.priority WHEN "urgente" THEN 1 WHEN "alta" THEN 2 WHEN "media" THEN 3 ELSE 4 END, t.due_date ASC, t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  return res.json({ tasks });
});

// 2. Obtener TAREAS COMPARTIDAS (familiares)
taskRouter.get('/shared', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const statusFilter = req.query.status as string;
  const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
  const memberFilter = req.query.memberId ? Number(req.query.memberId) : null;

  // Una tarea compartida es visible si:
  // a) El usuario actual la creó
  // b) O no tiene asignaciones específicas en task_shares (compartida para todos)
  // c) O está explícitamente compartida con el usuario actual en task_shares
  let query = `
    SELECT DISTINCT t.*,
           creator.name as creator_name, creator.color as creator_color, creator.avatar as creator_avatar,
           completer.name as completer_name, completer.color as completer_color
    FROM tasks t
    JOIN users creator ON t.user_id = creator.id
    LEFT JOIN users completer ON t.completed_by = completer.id
    LEFT JOIN task_shares ts ON t.id = ts.task_id
    WHERE t.is_shared = 1
      AND (
        t.user_id = ?
        OR ts.user_id = ?
        OR (NOT EXISTS (SELECT 1 FROM task_shares WHERE task_id = t.id))
      )
  `;
  const params: any[] = [userId, userId];

  if (statusFilter === 'pending') {
    query += ' AND t.is_completed = 0';
  } else if (statusFilter === 'completed') {
    query += ' AND t.is_completed = 1';
  }

  if (memberFilter) {
    query += ' AND (t.user_id = ? OR ts.user_id = ?)';
    params.push(memberFilter, memberFilter);
  }

  if (search) {
    query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    params.push(search, search);
  }

  query += ' ORDER BY t.is_completed ASC, CASE t.priority WHEN "urgente" THEN 1 WHEN "alta" THEN 2 WHEN "media" THEN 3 ELSE 4 END, t.due_date ASC, t.created_at DESC';

  const tasks = db.prepare(query).all(...params) as any[];

  // Adjuntar información de con quién se comparte cada tarea
  const tasksWithShares = tasks.map(task => {
    const shares = db.prepare(`
      SELECT u.id, u.name, u.color, u.avatar
      FROM task_shares ts
      JOIN users u ON ts.user_id = u.id
      WHERE ts.task_id = ?
    `).all(task.id);
    return { ...task, shared_with: shares };
  });

  return res.json({ tasks: tasksWithShares });
});

// 3. Crear una nueva tarea (Personal o Compartida)
taskRouter.post('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { title, description, priority, due_date, due_time, is_shared, shared_with_ids } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título de la tarea es requerido.' });
  }

  const sharedFlag = is_shared ? 1 : 0;
  const taskPriority = priority || 'media';
  const taskDueDate = due_date || null;
  const taskDueTime = due_time || null;

  const insertStmt = db.prepare(`
    INSERT INTO tasks (user_id, is_shared, title, description, priority, due_date, due_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    userId,
    sharedFlag,
    title.trim(),
    description ? description.trim() : null,
    taskPriority,
    taskDueDate,
    taskDueTime
  );

  const newTaskId = Number(result.lastInsertRowid);

  // Si es compartida y se especificaron familiares concretos, guardarlos en task_shares
  if (sharedFlag === 1 && Array.isArray(shared_with_ids) && shared_with_ids.length > 0) {
    const shareStmt = db.prepare('INSERT OR IGNORE INTO task_shares (task_id, user_id) VALUES (?, ?)');
    for (const memberId of shared_with_ids) {
      if (Number(memberId)) {
        shareStmt.run(newTaskId, Number(memberId));
      }
    }
  }

  const createdTask = db.prepare(`
    SELECT t.*, u.name as creator_name, u.color as creator_color, u.avatar as creator_avatar
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(newTaskId);

  return res.status(201).json({ task: createdTask });
});

// 4. Actualizar tarea o alternar estado completado
taskRouter.patch('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const taskId = Number(req.params.id);

  // Buscar la tarea
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Tarea no encontrada.' });
  }

  // Si es personal, solo el creador puede editarla
  if (existing.is_shared === 0 && existing.user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea personal.' });
  }

  const { title, description, priority, due_date, due_time, is_completed, shared_with_ids } = req.body;
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description ? description.trim() : null);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (due_date !== undefined) {
    updates.push('due_date = ?');
    params.push(due_date || null);
  }
  if (due_time !== undefined) {
    updates.push('due_time = ?');
    params.push(due_time || null);
  }

  // Alternar completado
  if (is_completed !== undefined) {
    const completedVal = is_completed ? 1 : 0;
    updates.push('is_completed = ?');
    params.push(completedVal);

    if (completedVal === 1) {
      updates.push('completed_by = ?, completed_at = CURRENT_TIMESTAMP');
      params.push(userId);
    } else {
      updates.push('completed_by = NULL, completed_at = NULL');
    }
  }

  if (updates.length > 0) {
    params.push(taskId);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  // Actualizar miembros compartidos si se enviaron
  if (existing.is_shared === 1 && Array.isArray(shared_with_ids)) {
    db.prepare('DELETE FROM task_shares WHERE task_id = ?').run(taskId);
    const shareStmt = db.prepare('INSERT OR IGNORE INTO task_shares (task_id, user_id) VALUES (?, ?)');
    for (const memberId of shared_with_ids) {
      if (Number(memberId)) {
        shareStmt.run(taskId, Number(memberId));
      }
    }
  }

  const updatedTask = db.prepare(`
    SELECT t.*, creator.name as creator_name, creator.color as creator_color, creator.avatar as creator_avatar,
           completer.name as completer_name, completer.color as completer_color
    FROM tasks t
    JOIN users creator ON t.user_id = creator.id
    LEFT JOIN users completer ON t.completed_by = completer.id
    WHERE t.id = ?
  `).get(taskId) as any;

  if (updatedTask.is_shared === 1) {
    const shares = db.prepare(`
      SELECT u.id, u.name, u.color, u.avatar
      FROM task_shares ts
      JOIN users u ON ts.user_id = u.id
      WHERE ts.task_id = ?
    `).all(taskId);
    updatedTask.shared_with = shares;
  }

  return res.json({ task: updatedTask });
});

// 5. Eliminar tarea
taskRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const taskId = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Tarea no encontrada.' });
  }

  // Si es personal, solo el creador puede borrarla. Si es compartida, creador o admin.
  if (existing.user_id !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea.' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return res.json({ success: true });
});

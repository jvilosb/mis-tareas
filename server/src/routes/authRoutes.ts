import { Router, Response } from 'express';
import { db } from '../db';
import {
  hashPassword,
  comparePassword,
  signToken,
  COOKIE_NAME,
  requireAuth,
  AuthenticatedRequest,
  AuthUser,
} from '../auth';

export const authRouter = Router();

// Configuración de cookie segura para producción y desarrollo
function setAuthCookie(res: Response, token: string, rememberMe = true) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

// 1. Verificar estado de la sesión y si requiere configuración inicial
authRouter.get('/me', (req: AuthenticatedRequest, res) => {
  // Verificar si hay usuarios registrados
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    return res.json({ needsSetup: true, user: null });
  }

  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ needsSetup: false, user: null });
  }

  try {
    const { verifyToken } = require('../auth');
    const user = verifyToken(token);
    if (!user) {
      return res.json({ needsSetup: false, user: null });
    }

    // Consultar datos actualizados del usuario
    const dbUser = db.prepare('SELECT id, username, name, role, color, avatar FROM users WHERE id = ?').get(user.id) as AuthUser;
    if (!dbUser) {
      return res.json({ needsSetup: false, user: null });
    }

    return res.json({ needsSetup: false, user: dbUser });
  } catch {
    return res.json({ needsSetup: false, user: null });
  }
});

// 2. Configuración inicial (crear el usuario principal / admin)
authRouter.post('/setup', async (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
      return res.status(400).json({ error: 'El sistema ya ha sido configurado previamente.' });
    }

    const { username, name, password, color, avatar } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Nombre de usuario, nombre visible y contraseña son requeridos.' });
    }

    const passwordHash = await hashPassword(password);
    const userColor = color || '#00205B'; // Getram Navy por defecto
    const userAvatar = avatar || '👨‍💻';

    const result = db.prepare(`
      INSERT INTO users (username, name, role, color, avatar, password_hash)
      VALUES (?, ?, 'admin', ?, ?, ?)
    `).run(username.trim().toLowerCase(), name.trim(), userColor, userAvatar, passwordHash);

    const newUser: AuthUser = {
      id: Number(result.lastInsertRowid),
      username: username.trim().toLowerCase(),
      name: name.trim(),
      role: 'admin',
      color: userColor,
      avatar: userAvatar,
    };

    const token = signToken(newUser, true);
    setAuthCookie(res, token, true);

    return res.status(201).json({ user: newUser, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al configurar el usuario inicial.' });
  }
});

// 3. Inicio de sesión
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      color: user.color,
      avatar: user.avatar,
    };

    const shouldRemember = rememberMe !== false;
    const token = signToken(authUser, shouldRemember);
    setAuthCookie(res, token, shouldRemember);

    return res.json({ user: authUser, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error en el inicio de sesión.' });
  }
});

// 4. Cerrar sesión
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true });
});

// 5. Listar miembros familiares
authRouter.get('/users', requireAuth, (_req, res) => {
  const users = db.prepare('SELECT id, username, name, role, color, avatar, created_at FROM users ORDER BY name ASC').all();
  return res.json({ users });
});

// 6. Crear un nuevo miembro familiar (esposa, hijos)
authRouter.post('/users', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { username, name, password, color, avatar, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Nombre de usuario, nombre visible y contraseña/PIN son requeridos.' });
    }

    // Verificar si el username ya existe
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un familiar con ese nombre de usuario.' });
    }

    const passwordHash = await hashPassword(password);
    const memberColor = color || '#e11d48';
    const memberAvatar = avatar || '👤';
    const memberRole = role === 'admin' ? 'admin' : 'member';

    const result = db.prepare(`
      INSERT INTO users (username, name, role, color, avatar, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username.trim().toLowerCase(), name.trim(), memberRole, memberColor, memberAvatar, passwordHash);

    const newMember = {
      id: Number(result.lastInsertRowid),
      username: username.trim().toLowerCase(),
      name: name.trim(),
      role: memberRole,
      color: memberColor,
      avatar: memberAvatar,
    };

    return res.status(201).json({ user: newMember });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al agregar familiar.' });
  }
});

// 7. Eliminar familiar
authRouter.delete('/users/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user?.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  return res.json({ success: true });
});

// 8. Actualizar perfil o color de un miembro
authRouter.patch('/users/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  const { name, color, avatar, password } = req.body;

  // Solo admin o el propio usuario pueden editar
  if (req.user?.role !== 'admin' && req.user?.id !== targetId) {
    return res.status(403).json({ error: 'No tienes permiso para modificar este perfil.' });
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (name) {
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (color) {
    updates.push('color = ?');
    params.push(color);
  }
  if (avatar) {
    updates.push('avatar = ?');
    params.push(avatar);
  }
  if (password) {
    const passwordHash = await hashPassword(password);
    updates.push('password_hash = ?');
    params.push(passwordHash);
  }

  if (updates.length > 0) {
    params.push(targetId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updatedUser = db.prepare('SELECT id, username, name, role, color, avatar FROM users WHERE id = ?').get(targetId);
  return res.json({ user: updatedUser });
});

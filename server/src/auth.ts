import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

// El secreto JWT es obligatorio: si falta, se aborta el arranque en lugar de usar un valor por defecto inseguro.
const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error('[auth] FATAL: falta la variable de entorno JWT_SECRET. Define un secreto largo y aleatorio.');
}
const JWT_SECRET: string = JWT_SECRET_VALUE;
export const COOKIE_NAME = 'ramtask_session';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  color: string;
  avatar: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Generar hash de contraseña seguro
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Comparar contraseña con el hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Firmar token JWT de sesión (30 días de persistencia)
export function signToken(user: AuthUser, rememberMe = true): string {
  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      color: user.color,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

// Verificar token JWT
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

// Middleware para requerir autenticación en rutas privadas
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Buscar token en cookie o en header Authorization: Bearer <token>
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión para continuar.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sesión expirada o inválida.' });
  }

  // Revalidar contra la base de datos: si el usuario fue borrado o cambió de rol, surte efecto de inmediato.
  const current = db
    .prepare('SELECT id, username, name, role, color, avatar FROM users WHERE id = ?')
    .get(payload.id) as AuthUser | undefined;

  if (!current) {
    return res.status(401).json({ error: 'Sesión inválida. El usuario ya no existe.' });
  }

  req.user = current;
  next();
}

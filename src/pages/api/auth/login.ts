import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import bcrypt from 'bcryptjs';
import { json, error } from '../../../lib/response';
import { required, isEmail, validateAll } from '../../../lib/validate';
import type { User } from '../../../db/types';

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const POST: APIRoute = async ({ request, cookies }) => {
  const data = await request.formData();
  const email = (data.get('email') as string)?.toLowerCase().trim();
  const password = data.get('password') as string;

  const validationError = validateAll([
    required(email, 'Email'),
    isEmail(email),
    required(password, 'Contraseña'),
  ]);
  if (validationError) return error(validationError);

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.count >= MAX_ATTEMPTS) {
    const minutesElapsed = (Date.now() - attempt.lastAttempt) / 60000;
    if (minutesElapsed < LOCKOUT_MINUTES) {
      return error(`Demasiados intentos. Intenta de nuevo en ${Math.ceil(LOCKOUT_MINUTES - minutesElapsed)} minutos`, 429);
    }
    loginAttempts.delete(ip);
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get<User>(email);
    if (!user) return error('Credenciales inválidas', 401);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const entry = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
      entry.count++;
      entry.lastAttempt = Date.now();
      loginAttempts.set(ip, entry);
      return error('Credenciales inválidas', 401);
    }

    loginAttempts.delete(ip);

    cookies.set('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }), {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return json({ message: 'Login exitoso', role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    return error('Error interno del servidor', 500);
  }
};

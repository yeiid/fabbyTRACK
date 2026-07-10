import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import bcrypt from 'bcryptjs';
import { json, error } from '../../../lib/response';
import { required, isEmail, minLength, validateAll } from '../../../lib/validate';

export const POST: APIRoute = async ({ request, cookies }) => {
  const data = await request.formData();
  const name = (data.get('name') as string)?.trim();
  const email = (data.get('email') as string)?.toLowerCase().trim();
  const password = data.get('password') as string;

  const validationError = validateAll([
    required(name, 'Nombre'),
    required(email, 'Email'),
    isEmail(email),
    required(password, 'Contraseña'),
    minLength(password, 6, 'Contraseña'),
  ]);
  if (validationError) return error(validationError);

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return error('El email ya está registrado', 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, subscription_status)
      VALUES (?, ?, ?, 'user', 'trial')
    `).run(name, email, hashedPassword);

    const userId = Number(result.lastInsertRowid);
    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(userId);

    cookies.set('user_session', JSON.stringify({
      id: userId,
      email,
      role: 'user',
      name
    }), {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return json({ message: 'Usuario registrado correctamente' }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error('Error interno del servidor', 500);
  }
};

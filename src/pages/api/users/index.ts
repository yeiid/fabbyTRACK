import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import bcrypt from 'bcryptjs';
import { required, isEmail, minLength, validateAll } from '../../../lib/validate';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  try {
    const url = new URL(ctx.request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const active = url.searchParams.get('active') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let where = "WHERE u.role = 'user'";
    const params: unknown[] = [];

    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q);
    }
    if (status) {
      where += ' AND u.subscription_status = ?';
      params.push(status);
    }
    if (active === 'true') {
      where += ' AND u.is_active = 1';
    } else if (active === 'false') {
      where += ' AND u.is_active = 0';
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM users u ${where}
    `).get<{ total: number }>(...params);

    const total = countRow?.total ?? 0;

    const users = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.is_active, u.subscription_status, u.subscription_expires_at,
             p.weight_kg, p.height_cm, p.goal, p.maintenance_calories, p.target_calories
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all<Record<string, unknown>>(...params, limit, offset);

    return json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Fetch users error:', err);
    return error('Error al obtener usuarios', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  try {
    const data = await ctx.request.json();
    const { name, email, password, goal, weight_kg, height_cm } = data;

    const validationError = validateAll([
      required(name, 'Nombre'),
      required(email, 'Email'),
      isEmail(email),
      required(password, 'Contraseña'),
      minLength(password, 6, 'Contraseña'),
    ]);
    if (validationError) return error(validationError);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) return error('El email ya está registrado', 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, subscription_status)
      VALUES (?, ?, ?, 'user', 'trial')
    `).run(name, email.toLowerCase().trim(), hashedPassword);

    const userId = Number(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO user_profiles (user_id, goal, weight_kg, height_cm)
      VALUES (?, ?, ?, ?)
    `).run(userId, goal || null, weight_kg ?? null, height_cm ?? null);

    return json({ message: 'Usuario creado correctamente', id: userId }, 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error('Error al crear usuario', 500);
  }
};

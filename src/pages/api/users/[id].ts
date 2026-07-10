import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { isEmail } from '../../../lib/validate';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;
  if (!id) return error('ID de usuario requerido');

  try {
    const user = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.is_active, u.subscription_status, u.subscription_expires_at, u.created_at,
             p.weight_kg, p.height_cm, p.age, p.gender, p.goal, p.maintenance_calories, p.target_calories
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get<Record<string, unknown>>(id);

    if (!user) return error('Usuario no encontrado', 404);

    const routines = db.prepare(`
      SELECT ur.day_of_week, r.id as routine_id, r.name as routine_name
      FROM user_routines ur
      JOIN routines r ON r.id = ur.routine_id
      WHERE ur.user_id = ?
      ORDER BY ur.day_of_week
    `).all<Record<string, unknown>>(id);

    const meals = db.prepare(`
      SELECT ump.day_of_week, ump.meal_type, m.id as meal_id, m.name as meal_name
      FROM user_meal_plans ump
      JOIN meals m ON m.id = ump.meal_id
      WHERE ump.user_id = ?
      ORDER BY ump.day_of_week, ump.meal_type
    `).all<Record<string, unknown>>(id);

    const lastMeasurement = db.prepare(`
      SELECT * FROM body_measurements
      WHERE user_id = ?
      ORDER BY measured_at DESC
      LIMIT 1
    `).get<Record<string, unknown>>(id);

    return json({ ...user, routines, meals, lastMeasurement });
  } catch (err) {
    console.error('Fetch user detail error:', err);
    return error('Error al obtener usuario', 500);
  }
};

export const PATCH: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;
  const data = await ctx.request.json();

  if (!id) return error('ID de usuario requerido');

  const { is_active, subscription_status, maintenance_calories, target_calories,
          name, email, goal, weight_kg, height_cm } = data;

  if (email) {
    const emailError = isEmail(email);
    if (emailError) return error(emailError);

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), id);
    if (existing) return error('El email ya está en uso', 409);
  }

  const validStatuses = ['active', 'expired', 'trial'];
  if (subscription_status && !validStatuses.includes(subscription_status)) {
    return error('Estado de suscripción inválido');
  }

  try {
    db.exec('BEGIN TRANSACTION');

    const userUpdates: string[] = [];
    const userParams: unknown[] = [];

    if (is_active !== undefined) {
      userUpdates.push('is_active = ?');
      userParams.push(is_active ? 1 : 0);
    }
    if (subscription_status !== undefined) {
      userUpdates.push('subscription_status = ?');
      userParams.push(subscription_status);
    }
    if (name !== undefined) {
      userUpdates.push('name = ?');
      userParams.push(name);
    }
    if (email !== undefined) {
      userUpdates.push('email = ?');
      userParams.push(email.toLowerCase().trim());
    }

    if (userUpdates.length > 0) {
      userParams.push(id);
      db.prepare(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`).run(...userParams);
    }

    if (maintenance_calories !== undefined || target_calories !== undefined ||
        goal !== undefined || weight_kg !== undefined || height_cm !== undefined) {
      db.prepare(`
        INSERT INTO user_profiles (user_id, maintenance_calories, target_calories, goal, weight_kg, height_cm, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          maintenance_calories = COALESCE(EXCLUDED.maintenance_calories, user_profiles.maintenance_calories),
          target_calories = COALESCE(EXCLUDED.target_calories, user_profiles.target_calories),
          goal = COALESCE(EXCLUDED.goal, user_profiles.goal),
          weight_kg = COALESCE(EXCLUDED.weight_kg, user_profiles.weight_kg),
          height_cm = COALESCE(EXCLUDED.height_cm, user_profiles.height_cm),
          updated_at = CURRENT_TIMESTAMP
      `).run(id,
        maintenance_calories ?? null, target_calories ?? null,
        goal ?? null, weight_kg ?? null, height_cm ?? null
      );
    }

    db.exec('COMMIT');
    return json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Update user error:', err);
    return error('Error al actualizar usuario', 500);
  }
};

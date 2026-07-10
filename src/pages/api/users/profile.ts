import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireSession } from '../../../lib/session';
import type { UserProfile } from '../../../db/types';

export const GET: APIRoute = async (ctx) => {
  const session = requireSession(ctx);
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get<UserProfile>(session.id);
    return json(profile || {});
  } catch (err) {
    console.error('Fetch profile error:', err);
    return error('Error al obtener perfil', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireSession(ctx);
  const data = await ctx.request.json();
  const { weight_kg, height_cm, age, gender, goal, maintenance_calories, target_calories } = data;

  try {
    const existing = db.prepare('SELECT id FROM user_profiles WHERE user_id = ?').get(session.id);

    if (existing) {
      db.prepare(`
        UPDATE user_profiles 
        SET weight_kg = ?, height_cm = ?, age = ?, gender = ?, goal = ?, 
            maintenance_calories = ?, target_calories = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(weight_kg ?? null, height_cm ?? null, age ?? null, gender ?? null, goal ?? null, maintenance_calories ?? null, target_calories ?? null, session.id);
    } else {
      db.prepare(`
        INSERT INTO user_profiles (user_id, weight_kg, height_cm, age, gender, goal, maintenance_calories, target_calories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(session.id, weight_kg ?? null, height_cm ?? null, age ?? null, gender ?? null, goal ?? null, maintenance_calories ?? null, target_calories ?? null);
    }

    return json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Profile update error:', err);
    return error('Error al actualizar perfil', 500);
  }
};

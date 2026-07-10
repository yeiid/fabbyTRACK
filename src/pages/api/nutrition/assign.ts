import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';

interface Assignment {
  meal_id: number;
  day_of_week: string;
  meal_type: string;
}

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const url = new URL(ctx.request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) return error('userId requerido');

  try {
    const assignments = db.prepare(`
      SELECT ump.*, m.name as meal_name
      FROM user_meal_plans ump
      JOIN meals m ON m.id = ump.meal_id
      WHERE ump.user_id = ?
      ORDER BY ump.day_of_week, ump.meal_type
    `).all(userId);
    return json(assignments);
  } catch (err) {
    console.error('Fetch nutrition assignments error:', err);
    return error('Error al obtener asignaciones', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const data = await ctx.request.json();
  const { userId, assignments } = data as { userId: number; assignments: Assignment[] };

  const validationError = validateAll([
    required(userId, 'Usuario'),
    required(assignments, 'Asignaciones'),
  ]);
  if (validationError) return error(validationError);

  if (!Array.isArray(assignments)) return error('Asignaciones debe ser un arreglo');

  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare('DELETE FROM user_meal_plans WHERE user_id = ?').run(userId);

    const stmt = db.prepare(`
      INSERT INTO user_meal_plans (user_id, meal_id, day_of_week, meal_type, assigned_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const assign of assignments) {
      if (!assign.meal_id || !assign.day_of_week || !assign.meal_type) continue;
      stmt.run(userId, assign.meal_id, assign.day_of_week, assign.meal_type, session.id);
    }

    db.exec('COMMIT');
    return json({ message: 'Plan asignado correctamente' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Assignment error:', err);
    return error('Error al asignar el plan', 500);
  }
};

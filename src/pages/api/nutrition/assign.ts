import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';

const VALID_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

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
    `).all(Number(userId));
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

  const uid = Number(userId);
  if (!uid) return error('Usuario inválido');

  const validationError = validateAll([
    required(uid, 'Usuario'),
    required(assignments, 'Asignaciones'),
  ]);
  if (validationError) return error(validationError);

  if (!Array.isArray(assignments)) return error('Asignaciones debe ser un arreglo');

  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(uid);
  if (!userExists) return error('El usuario no existe');

  for (const a of assignments) {
    if (!VALID_DAYS.includes(a.day_of_week)) {
      return error(`Día inválido: ${a.day_of_week}`);
    }
    if (!VALID_MEAL_TYPES.includes(a.meal_type)) {
      return error(`Tipo de comida inválido: ${a.meal_type}`);
    }
    if (a.meal_id) {
      const mealExists = db.prepare('SELECT id FROM meals WHERE id = ?').get(Number(a.meal_id));
      if (!mealExists) return error(`La comida con ID ${a.meal_id} no existe`);
    }
  }

  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare('DELETE FROM user_meal_plans WHERE user_id = ?').run(uid);

    const stmt = db.prepare(`
      INSERT INTO user_meal_plans (user_id, meal_id, day_of_week, meal_type, assigned_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const assign of assignments) {
      if (!assign.meal_id || !assign.day_of_week || !assign.meal_type) continue;
      stmt.run(uid, Number(assign.meal_id), assign.day_of_week, assign.meal_type, session.id);
    }

    db.exec('COMMIT');
    return json({ message: 'Plan asignado correctamente' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Assignment error:', err);
    return error('Error al asignar el plan', 500);
  }
};

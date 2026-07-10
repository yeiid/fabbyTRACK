import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';

const VALID_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface RoutineAssignment {
  routine_id: number;
  day_of_week: string;
}

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const url = new URL(ctx.request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) return error('userId requerido');

  try {
    const assignments = db.prepare(`
      SELECT ur.*, r.name as routine_name
      FROM user_routines ur
      JOIN routines r ON r.id = ur.routine_id
      WHERE ur.user_id = ?
      ORDER BY ur.day_of_week
    `).all(userId);
    return json(assignments);
  } catch (err) {
    console.error('Fetch routine assignments error:', err);
    return error('Error al obtener asignaciones', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const data = await ctx.request.json();
  const { userId, assignments } = data as { userId: number; assignments: RoutineAssignment[] };

  const validationError = validateAll([
    required(userId, 'Usuario'),
    required(assignments, 'Asignaciones'),
  ]);
  if (validationError) return error(validationError);

  if (!Array.isArray(assignments)) return error('Asignaciones debe ser un arreglo');

  for (const a of assignments) {
    if (!VALID_DAYS.includes(a.day_of_week)) {
      return error(`Día inválido: ${a.day_of_week}`);
    }
  }

  try {
    db.exec('BEGIN TRANSACTION');
    db.prepare('DELETE FROM user_routines WHERE user_id = ?').run(userId);

    const stmt = db.prepare(`
      INSERT INTO user_routines (user_id, routine_id, day_of_week, assigned_by)
      VALUES (?, ?, ?, ?)
    `);

    for (const assign of assignments) {
      if (!assign.routine_id || !assign.day_of_week) continue;
      stmt.run(userId, assign.routine_id, assign.day_of_week, session.id);
    }

    db.exec('COMMIT');
    return json({ message: 'Rutinas asignadas correctamente' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Assign routine error:', err);
    return error('Error al asignar rutinas', 500);
  }
};

import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';
import type { RoutineExercise } from '../../../db/types';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;

  try {
    const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(id);
    if (!routine) return error('Rutina no encontrada', 404);

    const exercises = db.prepare(`
      SELECT re.*, e.name, e.muscle_group, e.difficulty, e.youtube_url, e.description
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      WHERE re.routine_id = ?
      ORDER BY re.order_index ASC
    `).all<RoutineExercise & { name: string; muscle_group: string; difficulty: string; youtube_url: string | null; description: string | null }>(id);

    return json({ ...routine, exercises });
  } catch (err) {
    console.error('Fetch routine error:', err);
    return error('Error al obtener rutina', 500);
  }
};

export const PATCH: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;
  const data = await ctx.request.json();
  const { name, description } = data;

  const validationError = validateAll([required(name, 'Nombre')]);
  if (validationError) return error(validationError);

  try {
    const result = db.prepare(`
      UPDATE routines SET name = ?, description = ? WHERE id = ?
    `).run(name, description || null, id);

    if (result.changes === 0) return error('Rutina no encontrada', 404);
    return json({ message: 'Rutina actualizada' });
  } catch (err) {
    console.error('Update routine error:', err);
    return error('Error al actualizar rutina', 500);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;

  try {
    const result = db.prepare('DELETE FROM routines WHERE id = ?').run(id);
    if (result.changes === 0) return error('Rutina no encontrada', 404);
    return json({ message: 'Rutina eliminada' });
  } catch (err) {
    console.error('Delete routine error:', err);
    return error('Error al eliminar rutina', 500);
  }
};

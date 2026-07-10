import type { APIRoute } from 'astro';
import { db } from '../../../../db/connection';
import { json, error } from '../../../../lib/response';
import { requireRole } from '../../../../lib/session';
import { required, validateAll } from '../../../../lib/validate';

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id: routineId } = ctx.params;
  const data = await ctx.request.json();
  const { exercise_id, sets, reps, rest_seconds } = data;

  const validationError = validateAll([
    required(routineId, 'Rutina'),
    required(exercise_id, 'Ejercicio'),
  ]);
  if (validationError) return error(validationError);

  try {
    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 as next FROM routine_exercises WHERE routine_id = ?').get(routineId) as { next: number };

    const result = db.prepare(`
      INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(routineId, exercise_id, sets || 3, reps || 12, rest_seconds || 60, maxOrder.next);

    return json({ id: result.lastInsertRowid, message: 'Ejercicio agregado a la rutina' }, 201);
  } catch (err) {
    console.error('Add exercise to routine error:', err);
    return error('Error al agregar ejercicio', 500);
  }
};

export const PATCH: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id: routineId } = ctx.params;
  const data = await ctx.request.json();
  const { exercise_id, sets, reps, rest_seconds, order_index } = data;

  if (!exercise_id) return error('ID de ejercicio requerido');

  try {
    const result = db.prepare(`
      UPDATE routine_exercises
      SET sets = ?, reps = ?, rest_seconds = ?, order_index = ?
      WHERE routine_id = ? AND exercise_id = ?
    `).run(sets || 3, reps || 12, rest_seconds || 60, order_index || 0, routineId, exercise_id);

    if (result.changes === 0) return error('Ejercicio no encontrado en la rutina', 404);
    return json({ message: 'Ejercicio actualizado en la rutina' });
  } catch (err) {
    console.error('Update routine exercise error:', err);
    return error('Error al actualizar ejercicio', 500);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id: routineId } = ctx.params;
  const data = await ctx.request.json();
  const { exercise_id } = data;

  if (!exercise_id) return error('ID de ejercicio requerido');

  try {
    const result = db.prepare('DELETE FROM routine_exercises WHERE routine_id = ? AND exercise_id = ?').run(routineId, exercise_id);
    if (result.changes === 0) return error('Ejercicio no encontrado en la rutina', 404);
    return json({ message: 'Ejercicio eliminado de la rutina' });
  } catch (err) {
    console.error('Delete routine exercise error:', err);
    return error('Error al eliminar ejercicio', 500);
  }
};

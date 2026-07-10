import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';
import type { Routine } from '../../../db/types';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  try {
    const routines = db.prepare(`
      SELECT r.*, COUNT(re.id) as exercise_count
      FROM routines r
      LEFT JOIN routine_exercises re ON re.routine_id = r.id
      GROUP BY r.id
      ORDER BY r.name ASC
    `).all<Routine & { exercise_count: number }>();
    return json(routines);
  } catch (err) {
    console.error('Fetch routines error:', err);
    return error('Error al obtener rutinas', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const data = await ctx.request.json();
  const { name, description } = data;

  const validationError = validateAll([required(name, 'Nombre')]);
  if (validationError) return error(validationError);

  try {
    const result = db.prepare(`
      INSERT INTO routines (name, description, created_by)
      VALUES (?, ?, ?)
    `).run(name, description || null, session.id);

    return json({ id: result.lastInsertRowid, message: 'Rutina creada correctamente' }, 201);
  } catch (err) {
    console.error('Create routine error:', err);
    return error('Error al crear rutina', 500);
  }
};

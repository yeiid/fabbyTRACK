import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error, unauthorized } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';
import type { Exercise } from '../../../db/types';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  try {
    const exercises = db.prepare('SELECT * FROM exercises ORDER BY name ASC').all<Exercise>();
    return json(exercises);
  } catch (err) {
    console.error('Fetch exercises error:', err);
    return error('Error al obtener ejercicios', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const data = await ctx.request.json();
  const { name, description, recommendation, youtube_url, muscle_group, difficulty } = data;

  const validationError = validateAll([required(name, 'Nombre')]);
  if (validationError) return error(validationError);

  try {
    db.prepare(`
      INSERT INTO exercises (name, description, recommendation, youtube_url, muscle_group, difficulty, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || null, recommendation || null, youtube_url || null, muscle_group || null, difficulty || null, session.id);

    return json({ message: 'Ejercicio creado correctamente' }, 201);
  } catch (err) {
    console.error('Create exercise error:', err);
    return error('Error al crear ejercicio', 500);
  }
};

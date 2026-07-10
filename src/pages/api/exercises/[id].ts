import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';

export const PATCH: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;
  const data = await ctx.request.json();
  const { name, description, recommendation, youtube_url, muscle_group, difficulty } = data;

  if (!name) return error('El nombre es requerido');

  try {
    const result = db.prepare(`
      UPDATE exercises 
      SET name = ?, description = ?, recommendation = ?, youtube_url = ?, muscle_group = ?, difficulty = ?
      WHERE id = ?
    `).run(name, description || null, recommendation || null, youtube_url || null, muscle_group || null, difficulty || null, id);

    if (result.changes === 0) return error('Ejercicio no encontrado', 404);
    return json({ message: 'Ejercicio actualizado' });
  } catch (err) {
    console.error('Update exercise error:', err);
    return error('Error al actualizar', 500);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;

  try {
    const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
    if (result.changes === 0) return error('Ejercicio no encontrado', 404);
    return json({ message: 'Ejercicio eliminado' });
  } catch (err) {
    console.error('Delete exercise error:', err);
    return error('Error al eliminar', 500);
  }
};

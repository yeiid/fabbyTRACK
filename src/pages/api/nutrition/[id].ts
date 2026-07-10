import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';

export const DELETE: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const { id } = ctx.params;

  try {
    const result = db.prepare('DELETE FROM meals WHERE id = ?').run(id);
    if (result.changes === 0) return error('Comida no encontrada', 404);
    return json({ message: 'Comida eliminada' });
  } catch (err) {
    console.error('Delete meal error:', err);
    return error('Error al eliminar', 500);
  }
};

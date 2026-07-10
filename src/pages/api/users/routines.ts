import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireSession } from '../../../lib/session';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const GET: APIRoute = async (ctx) => {
  const session = requireSession(ctx);
  const today = DAYS[new Date().getDay()];

  try {
    const routines = db.prepare(`
      SELECT ur.*, r.name as routine_name, r.description as routine_description
      FROM user_routines ur
      JOIN routines r ON r.id = ur.routine_id
      WHERE ur.user_id = ? AND ur.day_of_week = ?
    `).all(session.id, today) as Array<{
      id: number;
      user_id: number;
      routine_id: number;
      day_of_week: string;
      routine_name: string;
      routine_description: string | null;
    }>;

    const result = [];
    for (const routine of routines) {
      const exercises = db.prepare(`
        SELECT re.*, e.name, e.muscle_group, e.difficulty, e.youtube_url, e.description as exercise_description
        FROM routine_exercises re
        JOIN exercises e ON e.id = re.exercise_id
        WHERE re.routine_id = ?
        ORDER BY re.order_index ASC
      `).all(routine.routine_id);

      result.push({
        id: routine.id,
        routine_id: routine.routine_id,
        routine_name: routine.routine_name,
        routine_description: routine.routine_description,
        day_of_week: routine.day_of_week,
        exercises,
      });
    }

    return json({ day: today, routines: result });
  } catch (err) {
    console.error('Fetch user routines error:', err);
    return error('Error al obtener rutinas', 500);
  }
};

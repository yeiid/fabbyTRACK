import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireSession } from '../../../lib/session';
import type { Meal, UserProfile } from '../../../db/types';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const GET: APIRoute = async (ctx) => {
  const session = requireSession(ctx);
  const today = DAYS[new Date().getDay()];

  try {
    const meals = db.prepare(`
      SELECT m.* 
      FROM user_meal_plans p
      JOIN meals m ON p.meal_id = m.id
      WHERE p.user_id = ? AND p.day_of_week = ?
    `).all<Meal>(session.id, today);

    const routines = db.prepare(`
      SELECT ur.*, r.name as routine_name, r.description as routine_description
      FROM user_routines ur
      JOIN routines r ON r.id = ur.routine_id
      WHERE ur.user_id = ? AND ur.day_of_week = ?
    `).all(session.id, today) as Array<{
      id: number; routine_id: number; routine_name: string; routine_description: string | null;
    }>;

    const routineWithExercises = [];
    for (const routine of routines) {
      const exercises = db.prepare(`
        SELECT re.*, e.name, e.muscle_group, e.difficulty, e.youtube_url, e.description as exercise_description
        FROM routine_exercises re
        JOIN exercises e ON e.id = re.exercise_id
        WHERE re.routine_id = ?
        ORDER BY re.order_index ASC
      `).all(routine.routine_id);
      routineWithExercises.push({ ...routine, exercises });
    }

    const profile = db.prepare('SELECT maintenance_calories, target_calories FROM user_profiles WHERE user_id = ?').get<UserProfile>(session.id);

    return json({
      day: today,
      meals,
      routines: routineWithExercises,
      calories: profile || { maintenance_calories: 0, target_calories: 0 }
    });
  } catch (err) {
    console.error('Plan error:', err);
    return error('Error al obtener el plan', 500);
  }
};

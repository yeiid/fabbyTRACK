import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireSession } from '../../../lib/session';

export const POST: APIRoute = async (ctx) => {
  const session = requireSession(ctx);
  const data = await ctx.request.json();
  const { weight_kg, leg_left_cm, leg_right_cm, calf_cm, glute_cm, abdomen_cm, waist_cm, chest_cm, arm_cm } = data;

  try {
    db.prepare(`
      INSERT INTO body_measurements (
        user_id, weight_kg, leg_left_cm, leg_right_cm, calf_cm, 
        glute_cm, abdomen_cm, waist_cm, chest_cm, arm_cm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, weight_kg ?? null, leg_left_cm ?? null, leg_right_cm ?? null, calf_cm ?? null,
      glute_cm ?? null, abdomen_cm ?? null, waist_cm ?? null, chest_cm ?? null, arm_cm ?? null
    );

    return json({ message: 'Medidas registradas' }, 201);
  } catch (err) {
    console.error('Measurement error:', err);
    return error('Error al registrar medidas', 500);
  }
};

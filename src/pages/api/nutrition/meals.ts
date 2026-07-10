import type { APIRoute } from 'astro';
import { db } from '../../../db/connection';
import { json, error } from '../../../lib/response';
import { requireRole } from '../../../lib/session';
import { required, validateAll } from '../../../lib/validate';
import type { Meal, MealIngredient } from '../../../db/types';

export const GET: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  try {
    const meals = db.prepare('SELECT * FROM meals ORDER BY name ASC').all<Meal>();
    const mealIds = meals.map(m => m.id);
    if (mealIds.length === 0) return json([]);

    // Single query for all ingredients instead of N+1
    const placeholders = mealIds.map(() => '?').join(',');
    const ingredients = db.prepare(`SELECT * FROM meal_ingredients WHERE meal_id IN (${placeholders})`).all<MealIngredient>(...mealIds);

    const ingredientsByMeal = new Map<number, MealIngredient[]>();
    for (const ing of ingredients) {
      const list = ingredientsByMeal.get(ing.meal_id) || [];
      list.push(ing);
      ingredientsByMeal.set(ing.meal_id, list);
    }

    const mealsWithIngredients = meals.map(meal => ({
      ...meal,
      ingredients: ingredientsByMeal.get(meal.id) || []
    }));

    return json(mealsWithIngredients);
  } catch (err) {
    console.error('Fetch meals error:', err);
    return error('Error al obtener comidas', 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const session = requireRole(ctx, 'master');
  const data = await ctx.request.json();
  const { name, description, meal_type, protein_g, carbs_g, fat_g, total_calories, ingredients, photo_url } = data;

  const validationError = validateAll([required(name, 'Nombre')]);
  if (validationError) return error(validationError);

  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (meal_type && !validMealTypes.includes(meal_type)) {
    return error('Tipo de comida inválido');
  }

  try {
    db.exec('BEGIN TRANSACTION');

    const result = db.prepare(`
      INSERT INTO meals (name, description, meal_type, protein_g, carbs_g, fat_g, total_calories, photo_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || null, meal_type || null, protein_g || null, carbs_g || null, fat_g || null, total_calories || null, photo_url || null, session.id);

    const mealId = Number(result.lastInsertRowid);

    if (ingredients && Array.isArray(ingredients)) {
      const stmt = db.prepare('INSERT INTO meal_ingredients (meal_id, ingredient_name, quantity) VALUES (?, ?, ?)');
      for (const ing of ingredients) {
        if (ing.name) {
          stmt.run(mealId, ing.name, ing.quantity || '');
        }
      }
    }

    db.exec('COMMIT');
    return json({ message: 'Comida creada correctamente' }, 201);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Create meal error:', err);
    return error('Error al crear comida', 500);
  }
};

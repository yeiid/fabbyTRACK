export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'master';
  is_active: number;
  subscription_status: 'active' | 'expired' | 'trial';
  subscription_expires_at: string | null;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  maintenance_calories: number | null;
  target_calories: number | null;
  updated_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  recommendation: string | null;
  youtube_url: string | null;
  muscle_group: string | null;
  difficulty: string | null;
  created_by: number | null;
  created_at: string;
}

export interface Routine {
  id: number;
  name: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
}

export interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
}

export interface UserRoutine {
  id: number;
  user_id: number;
  routine_id: number;
  day_of_week: string;
  assigned_at: string;
  assigned_by: number | null;
}

export interface BodyMeasurement {
  id: number;
  user_id: number;
  weight_kg: number | null;
  leg_left_cm: number | null;
  leg_right_cm: number | null;
  calf_cm: number | null;
  glute_cm: number | null;
  abdomen_cm: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  measured_at: string;
}

export interface Meal {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  total_calories: number | null;
  created_by: number | null;
  created_at: string;
}

export interface MealIngredient {
  id: number;
  meal_id: number;
  ingredient_name: string;
  quantity: string | null;
}

export interface UserMealPlan {
  id: number;
  user_id: number;
  meal_id: number;
  day_of_week: string;
  meal_type: string;
  assigned_at: string;
  assigned_by: number | null;
}

export interface UserWithProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: number;
  subscription_status: string;
  subscription_expires_at: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  maintenance_calories: number | null;
  target_calories: number | null;
}

export interface SessionUser {
  id: number;
  email: string;
  role: string;
  name: string;
}

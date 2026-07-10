import { db } from './connection';
import { initializeDatabase } from './schema';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@fabbytrack.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin';
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || 'user123';

async function seed() {
  console.log('Seeding database...');
  initializeDatabase();

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const adminHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const masterEmail = ADMIN_EMAIL;
  const existingMaster = db.prepare('SELECT id FROM users WHERE email = ?').get(masterEmail);
  if (!existingMaster) {
    db.prepare(`
      INSERT INTO users (email, password_hash, name, role, subscription_status)
      VALUES (?, ?, ?, ?, ?)
    `).run(masterEmail, adminHashedPassword, 'Coach Maestro', 'master', 'active');
    console.log(`Master user created: ${ADMIN_EMAIL}`);
  }

  const testUsers = [
    { name: 'Juan Pérez', email: 'juan@test.com', goal: 'lose_fat', weight: 85.5, height: 175, status: 'active' },
    { name: 'Maria Garcia', email: 'maria@test.com', goal: 'gain_muscle', weight: 62.0, height: 162, status: 'trial' },
    { name: 'Carlos Ruiz', email: 'carlos@test.com', goal: 'maintain', weight: 75.0, height: 180, status: 'expired' }
  ];

  for (const user of testUsers) {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email) as { id: number } | undefined;
    if (!existingUser) {
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, name, role, subscription_status)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.email, hashedPassword, user.name, 'user', user.status);

      const userId = Number(result.lastInsertRowid);
      db.prepare(`
        INSERT INTO user_profiles (user_id, goal, weight_kg, height_cm, maintenance_calories, target_calories)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, user.goal, user.weight, user.height, 2500, 2100);
    }
  }

  const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get() as { count: number };
  if (exerciseCount.count === 0) {
    const exercises = [
      ['Sentadilla Copa', 'Enfoque en cuádriceps', 'Mantener espalda recta', 'https://www.youtube.com/watch?v=me6hR0p5I34', 'Piernas', 'beginner'],
      ['Press Militar', 'Enfoque en hombro anterior', 'No arquear la espalda', 'https://www.youtube.com/watch?v=2yjwxt_OClw', 'Hombros', 'intermediate']
    ];

    const stmt = db.prepare(`
      INSERT INTO exercises (name, description, recommendation, youtube_url, muscle_group, difficulty, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    for (const ex of exercises) {
      stmt.run(...ex);
    }
    console.log('Default exercises seeded.');
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);

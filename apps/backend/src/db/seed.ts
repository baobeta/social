import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables BEFORE importing config/db
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { logger } from '../lib/logger.js';
import { db } from './connection.js';
import { users } from './schema/schema.js';
import { hashPassword } from '../lib/password.js';
import { eq } from 'drizzle-orm';

const seed = async () => {
  logger.info('Starting database seed...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      logger.info('Admin user already exists, skipping seed');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await hashPassword('admin@123');

    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      displayName: 'Admin',
      role: 'admin',
    });

    logger.info('Admin user created successfully');
    logger.info('Username: admin');
    logger.info('Password: admin@123');
    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  }
};

seed();

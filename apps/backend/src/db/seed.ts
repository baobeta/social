import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables BEFORE importing config/db
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { logger } from '../lib/logger.js';
import { db } from './connection.js';

const seed = async () => {
  logger.info('Starting database seed...');

  try {
    // Add your seed data here
    // Example:
    // await db.insert(users).values([...]);

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();

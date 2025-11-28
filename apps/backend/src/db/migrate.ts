import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables BEFORE importing config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';

const runMigrations = async () => {
  const connection = postgres(config.database.url, { max: 1 });
  const db = drizzle(connection);

  logger.info('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runMigrations();

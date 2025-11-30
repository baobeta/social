import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

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
    const migrationsPath = resolve(__dirname, './migrations');
    const metaPath = resolve(migrationsPath, './meta/_journal.json');
    
    logger.info({ 
      migrationsPath, 
      metaPath,
      pathExists: existsSync(migrationsPath),
      metaExists: existsSync(metaPath),
      cwd: process.cwd(),
      __dirname 
    }, 'Migration debug info');
    
    if (!existsSync(migrationsPath)) {
      throw new Error(`Migrations folder not found at: ${migrationsPath}. Current directory: ${process.cwd()}`);
    }
    if (!existsSync(metaPath)) {
      throw new Error(`Migration journal not found at: ${metaPath}. Make sure migrations are generated.`);
    }
    
    await migrate(db, { migrationsFolder: migrationsPath });
    logger.info('Migrations completed successfully');
  } catch (error) {
    console.error('Full migration error:', error);
    logger.error('Migration failed:', error as any);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runMigrations();

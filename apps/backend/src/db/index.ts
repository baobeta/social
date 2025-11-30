import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../lib/config.ts';
import * as schema from './schema/index.ts';

// Create PostgreSQL connection with caching disabled for tests
const connection = postgres(config.database.url, {
  max: config.isTest ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  transform: {
    undefined: null,
  },
});

// Create Drizzle instance
export const db = drizzle(connection, { schema });

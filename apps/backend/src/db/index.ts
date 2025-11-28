import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../lib/config.ts';
import * as schema from './schema/index.ts';

// Create PostgreSQL connection
const connection = postgres(config.database.url);

// Create Drizzle instance
export const db = drizzle(connection, { schema });

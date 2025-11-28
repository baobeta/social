import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../lib/config.js';
import * as schema from './schema/index.js';

/**
 * Test database connection
 *
 * This module provides a separate database connection specifically for tests.
 * It ensures tests don't interfere with development data.
 *
 * The connection uses TEST_DATABASE_URL if available, otherwise falls back to DATABASE_URL.
 * NODE_ENV should be set to 'test' when running tests (handled by vitest.config.ts)
 */

if (!config.isTest) {
  console.warn('⚠️  Warning: test-connection.ts is being imported outside of test environment');
}

// Create test-specific client with appropriate settings
const testClient = postgres(config.database.url, {
  max: 5, // Smaller pool size for tests
  idle_timeout: 10,
  connect_timeout: 5,
});

export const testDb = drizzle(testClient, { schema });

export const closeTestDatabase = async () => {
  await testClient.end();
};

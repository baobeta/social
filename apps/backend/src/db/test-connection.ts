import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../lib/config.js';
import * as schema from './schema/index.js';

/**
 * Test database connection
 *
 * Creates a fresh database connection for tests with caching disabled.
 * This ensures tests see the latest schema changes including newly created tables.
 */

if (!config.isTest) {
  console.warn('⚠️  Warning: test-connection.ts is being imported outside of test environment');
}

// Create a fresh postgres connection for tests with no caching
let testClient: ReturnType<typeof postgres> | null = null;
let testDbInstance: ReturnType<typeof drizzle> | null = null;

function createTestConnection() {
  if (testClient) {
    testClient.end({ timeout: 0 }).catch(() => {});
  }
  
  testClient = postgres(config.database.url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
    transform: {
      undefined: null,
    },
  });
  
  testDbInstance = drizzle(testClient, { schema });
  return testDbInstance;
}

// Initialize connection
export const testDb = createTestConnection();

// Function to refresh the connection (useful after migrations)
export function refreshTestConnection() {
  const refreshed = createTestConnection();
  // Update the exported testDb reference
  Object.assign(testDb, refreshed);
  return refreshed;
}

export const closeTestDatabase = async () => {
  if (testClient) {
    await testClient.end({ timeout: 0 });
    testClient = null;
    testDbInstance = null;
  }
};

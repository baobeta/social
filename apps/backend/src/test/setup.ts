import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { testDb, closeTestDatabase } from '../db/test-connection.js';
import { users, posts, comments } from '../db/schema/index.js';
import { sql } from 'drizzle-orm';
import { config } from '../lib/config.js';

/**
 * Global test setup for database integration tests
 *
 * This file:
 * - Sets up test database connection (separate from dev database)
 * - Cleans up data between tests
 * - Provides test utilities
 *
 * IMPORTANT: Tests use a separate database to avoid affecting development data.
 * The test database is determined by TEST_DATABASE_URL env variable.
 */

// Verify we're in test environment
if (!config.isTest) {
  throw new Error('Tests must run with NODE_ENV=test. Check vitest.config.ts');
}

// Store cleanup functions for test data
const testDataCleanup: (() => Promise<void>)[] = [];

/**
 * Clean all test data from database
 * This runs before each integration test to ensure isolation
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await testDb.delete(comments);
  await testDb.delete(posts);
  await testDb.delete(users);
}

/**
 * Export test database for use in tests and fixtures
 */
export { testDb as db };

/**
 * Register a cleanup function to run after test
 */
export function registerCleanup(cleanup: () => Promise<void>) {
  testDataCleanup.push(cleanup);
}

/**
 * Run all registered cleanup functions
 */
async function runCleanup() {
  for (const cleanup of testDataCleanup) {
    await cleanup();
  }
  testDataCleanup.length = 0;
}

// Global hooks for integration tests
beforeAll(async () => {
  // Verify database connection
  try {
    await testDb.execute(sql`SELECT 1`);
    console.log('✓ Test database connected');
    console.log(`✓ Using database: ${config.database.url}`);
  } catch (error) {
    console.error('✗ Test database connection failed:', error);
    throw error;
  }
});

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase();
});

// Run cleanup after each test
afterEach(async () => {
  await runCleanup();
});

afterAll(async () => {
  // Final cleanup
  await cleanDatabase();
  await closeTestDatabase();
  console.log('✓ Test database cleaned and connection closed');
});

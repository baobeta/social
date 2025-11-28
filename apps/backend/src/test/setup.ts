import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '../db/index.ts';
import { users, posts, comments } from '../db/schema/index.ts';
import { sql } from 'drizzle-orm';

/**
 * Global test setup for database integration tests
 *
 * This file:
 * - Sets up test database connection
 * - Cleans up data between tests
 * - Provides test utilities
 */

// Store cleanup functions for test data
const testDataCleanup: (() => Promise<void>)[] = [];

/**
 * Clean all test data from database
 * This runs before each integration test to ensure isolation
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(users);
}

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
    await db.execute(sql`SELECT 1`);
    console.log('✓ Test database connected');
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
  console.log('✓ Test database cleaned');
});

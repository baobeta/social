import { beforeAll, afterAll, beforeEach } from 'vitest';
import { testDb, closeTestDatabase, refreshTestConnection } from '../db/test-connection.js';
import { users, posts, comments, refreshTokens, auditLogs } from '../db/schema/index.js';
import { sql } from 'drizzle-orm';
import { config } from '../lib/config.js';

/**
 * Global test setup for database integration tests
 *
 * Simple approach:
 * - Sets up test database connection (separate from dev database)
 * - Cleans database before each test for isolation
 * - Tests run sequentially (fileParallelism: false)
 *
 * IMPORTANT: Tests use a separate database to avoid affecting development data.
 * The test database is determined by TEST_DATABASE_URL env variable.
 */

// Verify we're in test environment
if (!config.isTest) {
  throw new Error('Tests must run with NODE_ENV=test. Check vitest.config.ts');
}

/**
 * Clean all test data from database
 * This runs before each test to ensure isolation
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await testDb.delete(auditLogs);
  await testDb.delete(comments);
  await testDb.delete(posts);
  await testDb.delete(refreshTokens);
  await testDb.delete(users);
}

/**
 * Export test database for use in tests and fixtures
 */
export { testDb as db };

// Global hooks for integration tests
beforeAll(async () => {
  // Refresh connection to ensure we have a fresh connection after migrations
  refreshTestConnection();
  
  // Verify database connection
  try {
    await testDb.execute(sql`SELECT 1`);
    console.log('✓ Test database connected');
    console.log(`✓ Using database: ${config.database.url}`);
    
    // Verify audit_logs table exists by trying to query it
    try {
      await testDb.execute(sql`SELECT 1 FROM audit_logs LIMIT 1`);
      console.log('✓ Audit logs table exists');
    } catch (error) {
      console.warn('⚠ Audit logs table not found - migrations may need to be run');
      console.warn('  Run: NODE_ENV=test npm run db:migrate');
    }
  } catch (error) {
    console.error('✗ Test database connection failed:', error);
    throw error;
  }
});

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  // Final cleanup
  await cleanDatabase();
  await closeTestDatabase();
  console.log('✓ Test database cleaned and connection closed');
});

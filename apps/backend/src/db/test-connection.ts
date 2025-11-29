import { db } from './index.js';
import { config } from '../lib/config.js';

/**
 * Test database connection
 *
 * This module re-exports the main database connection for use in tests.
 * The main db connection already uses TEST_DATABASE_URL when NODE_ENV=test (handled by config).
 * Using the same connection pool for both tests and repositories ensures data consistency.
 */

if (!config.isTest) {
  console.warn('⚠️  Warning: test-connection.ts is being imported outside of test environment');
}

// Re-export the main db connection for use in tests
export const testDb = db;

// No-op since we're sharing the connection
export const closeTestDatabase = async () => {
  // Connection will be closed when process exits
  // We don't close it here to avoid closing the connection used by other code
};

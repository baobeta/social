/**
 * E2E Test Database Setup and Cleanup Utilities
 *
 * This file provides utilities for setting up and cleaning the E2E test database.
 * It ensures tests run against a clean database state.
 *
 * Usage: Set NODE_ENV=e2e to use the E2E database
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../apps/backend/.env') });

// Get E2E database URL
const DATABASE_URL = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('E2E_DATABASE_URL is not defined in apps/backend/.env');
}

/**
 * Create a connection to the E2E test database
 */
export function createTestDbConnection() {
  return postgres(DATABASE_URL, {
    max: 1, // Single connection for setup/cleanup
  });
}

/**
 * Clean all data from the test database
 * This truncates all tables in the correct order to respect foreign key constraints
 */
export async function cleanTestDatabase() {
  const sql = createTestDbConnection();

  try {
    // Truncate tables in reverse dependency order
    await sql`TRUNCATE TABLE comments RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE posts RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;

    console.log('✅ Test database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning test database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

/**
 * Check if the test database exists and has the correct schema
 */
export async function verifyTestDatabase() {
  const sql = createTestDbConnection();

  try {
    // Check if required tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tableNames = tables.map((t: any) => t.table_name);
    const requiredTables = ['users', 'posts', 'comments', 'refresh_tokens'];

    const missingTables = requiredTables.filter(
      (table) => !tableNames.includes(table)
    );

    if (missingTables.length > 0) {
      console.error(
        `❌ Missing required tables in test database: ${missingTables.join(', ')}`
      );
      console.error('💡 Run migrations: npm run db:migrate');
      return false;
    }

    console.log('✅ Test database schema verified');
    return true;
  } catch (error) {
    console.error('❌ Error verifying test database:', error);
    return false;
  } finally {
    await sql.end();
  }
}

/**
 * Setup test database (run before test suite)
 * This verifies the database exists and has the correct schema
 */
export async function setupTestDatabase() {
  console.log('🔧 Setting up E2E test database...');

  const isValid = await verifyTestDatabase();

  if (!isValid) {
    throw new Error('Test database is not properly configured');
  }

  // Clean database before tests
  await cleanTestDatabase();

  console.log('✅ E2E test database ready');
}

/**
 * Teardown test database (run after test suite)
 * Optional: Clean up data after all tests complete
 */
export async function teardownTestDatabase() {
  console.log('🧹 Cleaning up E2E test database...');

  try {
    await cleanTestDatabase();
    console.log('✅ E2E test database cleaned');
  } catch (error) {
    console.error('❌ Error during test database teardown:', error);
  }
}

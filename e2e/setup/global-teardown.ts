/**
 * Playwright Global Teardown
 *
 * This file runs once after all E2E tests.
 * It cleans up the test database.
 */

import { teardownTestDatabase } from './database';

async function globalTeardown() {
  console.log('\n🧹 Starting E2E Test Suite Teardown...\n');

  try {
    // Clean test database after all tests
    await teardownTestDatabase();

    console.log('\n✅ E2E Test Suite Teardown Complete\n');
  } catch (error) {
    console.error('\n❌ E2E Test Suite Teardown Failed\n', error);
    // Don't throw - allow process to exit even if cleanup fails
  }
}

export default globalTeardown;

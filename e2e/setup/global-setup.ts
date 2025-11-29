/**
 * Playwright Global Setup
 *
 * This file runs once before all E2E tests.
 * It sets up the test database and ensures everything is ready.
 */

import { setupTestDatabase } from './database';

async function globalSetup() {
  console.log('\n🚀 Starting E2E Test Suite Setup...\n');

  try {
    // Setup and clean test database
    await setupTestDatabase();

    console.log('\n✅ E2E Test Suite Setup Complete\n');
  } catch (error) {
    console.error('\n❌ E2E Test Suite Setup Failed\n', error);
    throw error;
  }
}

export default globalSetup;

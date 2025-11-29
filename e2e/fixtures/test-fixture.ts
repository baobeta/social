import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { registerUser, loginUser, type TestUser } from '../utils/api-helpers';

/**
 * Custom fixtures for E2E tests
 *
 * These fixtures provide common functionality like:
 * - Authenticated user sessions
 * - Test data setup
 * - Page helpers
 */

interface TestFixtures {
  // Authenticated page with logged-in user
  authenticatedPage: Page;

  // Test user credentials
  testUser: TestUser;
}

export const test = base.extend<TestFixtures>({
  // Test user fixture - creates a unique user for each test
  testUser: async ({}, use) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    const user: TestUser = {
      username: `testuser_${timestamp}_${random}`,
      password: 'TestPassword123!',
      fullName: 'Test User',
      displayName: 'Tester',
    };

    await use(user);
  },

  // Authenticated page fixture - provides a page with logged-in user
  authenticatedPage: async ({ page, request, testUser }, use) => {
    // Register the user
    await registerUser(request, testUser);

    // Login via UI (more realistic than API login for E2E)
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for login to complete (adjust selector based on your app)
    await page.waitForURL('/');

    await use(page);
  },
});

export { expect } from '@playwright/test';

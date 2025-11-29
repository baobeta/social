import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { registerUser, loginUser, type TestUser } from '../utils/api-helpers';
import { createDynamicUser, seedUser, TEST_USERS, type SeededUser } from './test-users';

/**
 * Custom fixtures for E2E tests
 *
 * These fixtures provide common functionality like:
 * - Authenticated user sessions with predefined or dynamic users
 * - Test data setup
 * - Page helpers
 */

interface TestFixtures {
  // Authenticated page with logged-in user (dynamic user)
  authenticatedPage: Page;

  // Authenticated page with predefined regular user
  authenticatedRegularUser: Page;

  // Authenticated page with predefined admin user
  authenticatedAdminUser: Page;

  // Dynamic test user credentials (unique for each test)
  testUser: TestUser;

  // Predefined regular test user
  regularUser: SeededUser;

  // Predefined admin test user
  adminUser: SeededUser;
}

export const test = base.extend<TestFixtures>({
  // Dynamic test user - creates a unique user for each test
  testUser: async ({ }, use) => {
    const user = createDynamicUser();
    await use(user);
  },

  // Predefined regular user (seeded on demand)
  regularUser: async ({ request }, use) => {
    const user = await seedUser(request, TEST_USERS.regular);
    await use(user);
  },

  // Predefined admin user (seeded on demand)
  adminUser: async ({ request }, use) => {
    const user = await seedUser(request, TEST_USERS.admin);
    await use(user);
  },

  // Authenticated page with dynamic user
  authenticatedPage: async ({ page, request, testUser }, use) => {
    // Register the user
    await registerUser(request, testUser);

    // Login via UI (more realistic than API login for E2E)
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('[data-ci="login-username-input"]', testUser.username);
    await page.fill('[data-ci="login-password-input"] input', testUser.password);
    await page.click('[data-ci="login-submit-button"]');

    // Wait for login to complete
    await page.waitForURL('/timeline');

    await use(page);
  },

  // Authenticated page with predefined regular user
  authenticatedRegularUser: async ({ page, regularUser }, use) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('[data-ci="login-username-input"]', regularUser.username);
    await page.fill('[data-ci="login-password-input"] input', regularUser.password);
    await page.click('[data-ci="login-submit-button"]');
    await page.waitForURL('/timeline');

    await use(page);
  },

  // Authenticated page with predefined admin user
  authenticatedAdminUser: async ({ page, adminUser }, use) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('[data-ci="login-username-input"]', adminUser.username);
    await page.fill('[data-ci="login-password-input"] input', adminUser.password);
    await page.click('[data-ci="login-submit-button"]');
    await page.waitForURL('/timeline');

    await use(page);
  },
});

export { expect } from '@playwright/test';

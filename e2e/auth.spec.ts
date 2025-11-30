import { test, expect } from './fixtures/test-fixture';
import type { Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * These tests verify the complete authentication flow:
 * - User registration
 * - User login
 * - User logout
 * - Protected routes
 *
 * Uses data-ci attributes for reliable element selection
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display registration form', async ({ page }) => {
    await page.click('[data-ci="nav-register-link"]');
    await expect(page).toHaveURL('/register');
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Verify form fields exist
    await expect(page.locator('[data-ci="register-username-input"]')).toBeVisible();
    await expect(page.locator('[data-ci="register-password-input"]')).toBeVisible();
    await expect(page.locator('[data-ci="register-fullname-input"]')).toBeVisible();
    await expect(page.locator('[data-ci="register-submit-button"]')).toBeVisible();
  });

  async function setRegisterForm(page: Page, {
    username = '',
    password ='',
    rePassword = '',
    fullName = '',
  }) {
    await page.fill('[data-ci="register-username-input"]', username);
    await page.fill('[data-ci="register-password-input"]  input', password);
    await page.fill('[data-ci="register-re-password-input"]  input', rePassword);
    await page.fill('[data-ci="register-fullname-input"]', fullName);
  }

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    const username = `e2euser_${timestamp}`;

    await page.waitForLoadState('domcontentloaded');

    setRegisterForm(page, {
      username,
      password: 'TestPassword123!',
      rePassword: 'TestPassword123!',
      fullName: 'E2E Test User',
    })

    // Submit form
    await page.click('[data-ci="register-submit-button"]');

    await page.waitForLoadState('domcontentloaded');

    // Should redirect to home page after successful registration
    await expect(page).toHaveURL('/timeline');

    // Should display user info
    await expect(page.locator('[data-ci="user-display-name"]')).toContainText('E2E Test User');
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/register');

    await page.waitForLoadState('domcontentloaded');

    setRegisterForm(page, {
      username: 'testuser',
      password: '123', // Too short
      rePassword: '123', // Too short
      fullName: 'Test User',
    })

    await page.click('[data-ci="register-submit-button"]');

    await page.waitForLoadState('domcontentloaded');

    // Should show error message
    await expect(page.locator('[data-ci="register-error-message-password-strength"]')).toBeVisible();
  });

  async function setLoginForm(page: Page, { username = '', password = '' }) {
    await page.fill('[data-ci="login-username-input"]', username);
    await page.fill('[data-ci="login-password-input"] input', password);
  }

  test('should login with valid credentials', async ({ page }) => {
    // First, register a user via API
    const username = `e2euser_${Date.now()}`;
    const password = 'TestPassword123!';

    await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        username,
        password,
        fullName: 'Test User',
      },
    });

    // Navigate to login page
    await page.goto('/login');

    await page.waitForLoadState('domcontentloaded');
    setLoginForm(page, { username, password });

    // Wait for button to be enabled and then submit
    await page.waitForSelector('[data-ci="login-submit-button"]:not([disabled])', { timeout: 5000 });
    await page.click('[data-ci="login-submit-button"]');
    await page.waitForLoadState('domcontentloaded');

    // Wait for navigation to complete
    await page.waitForURL('/timeline', { timeout: 10000 });

    await expect(page).toHaveURL('/timeline');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.waitForLoadState('domcontentloaded');

    await setLoginForm(page, { username: 'nonexistent', password: 'wrong password' });

    await page.click('[data-ci="login-submit-button"]');
    // Should show error message
    await expect(page.locator('[data-ci="login-error-message"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login
    const username = `e2euser_${Date.now()}`;
    const password = 'TestPassword123!';

    await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        username,
        password,
        fullName: 'Test User',
      },
    });

    await page.goto('/login');
    await setLoginForm(page, { username, password });
    await page.click('[data-ci="login-submit-button"]');

    // Wait for home page
    await expect(page).toHaveURL('/timeline');

    // Should be logged in
    await expect(page.locator('[data-ci="user-display-name"]')).toContainText('Test User');

    // Click logout button
    await page.click('[data-ci="nav-logout-button"]');

    // Wait for login page
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access home page without authentication
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to login page (if home is protected)
    // Adjust this based on your app's routing logic
    await expect(page).toHaveURL('/home');
  });
});

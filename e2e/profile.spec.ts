import { test, expect } from './fixtures/test-fixture';

/**
 * Profile E2E Tests
 *
 * These tests verify the profile functionality:
 * - Viewing profile
 * - Updating full name
 * - Navbar display
 *
 * Uses data-ci attributes for reliable element selection
 */

test.describe('Profile', () => {
  test('should display user profile page', async ({ authenticatedRegularUser: page, regularUser }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    // Verify profile page is displayed
    await expect(page).toHaveURL('/profile');

    // Verify user info is displayed
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should update full name successfully (UC16)', async ({ authenticatedRegularUser: page, regularUser }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    const newFullName = `Updated Name ${Date.now()}`;

    // Find and update full name input
    const fullNameInput = page.locator('[data-ci="profile-fullname-input"]');
    await fullNameInput.clear();
    await fullNameInput.fill(newFullName);

    // Click save button
    await page.click('[data-ci="profile-save-button"]');

    // Wait for success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verify updated name appears in navbar
    await page.goto('/timeline');
    await expect(page.locator('[data-ci="user-display-name"]')).toContainText(newFullName);
  });

  test('should display user info in navbar (UC17)', async ({ authenticatedRegularUser: page, regularUser }) => {
    await page.goto('/timeline');

    // Verify navbar displays user info
    await expect(page.locator('[data-ci="user-display-name"]')).toBeVisible();

    // Verify logout button is present
    await expect(page.locator('[data-ci="nav-logout-button"]')).toBeVisible();
  });

  test('should navigate to profile from navbar', async ({ authenticatedRegularUser: page }) => {
    await page.goto('/timeline');

    // Click on user display name or profile link
    await page.locator('[data-ci="user-display-name"]').click();

    // Should navigate to profile page
    await expect(page).toHaveURL('/profile');
  });

  test('should cancel profile edit and return to timeline', async ({ authenticatedRegularUser: page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    // Make a change
    const fullNameInput = page.locator('[data-ci="profile-fullname-input"]');
    await fullNameInput.fill('Changed Name');

    // Click cancel
    await page.click('[data-ci="profile-cancel-button"]');

    // Should navigate back to timeline
    await expect(page).toHaveURL('/timeline');
  });

  test('should disable save button when no changes made', async ({ authenticatedRegularUser: page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    // Save button should be disabled initially
    const saveButton = page.locator('[data-ci="profile-save-button"]');
    await expect(saveButton).toBeDisabled();
  });
});

import { test, expect } from './fixtures/test-fixture';

/**
 * Posts E2E Tests
 *
 * These tests verify the post functionality:
 * - Creating posts
 * - Viewing timeline
 * - Editing posts
 * - Deleting posts
 * - Searching posts
 *
 * Uses data-ci attributes for reliable element selection
 */

test.describe('Posts', () => {
  test('should create a new post', async ({ authenticatedPage: page }) => {
    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');

    // Fill post content
    await page.fill('[data-ci="post-create-textarea"]', 'This is my first E2E test post!');

    // Click post button and wait for the post to be created
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/posts') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      page.click('[data-ci="post-create-submit-button"]')
    ]);

    // Wait for the timeline to reload and display the new post
    await page.waitForTimeout(500); // Small delay for UI update

    // Verify post appears in timeline
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'This is my first E2E test post!' })).toBeVisible();
  });

  test('should display posts in timeline', async ({ authenticatedPage: page, request }) => {
    // Create some posts via API
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'First post' },
      headers: { Cookie: cookieString },
    });

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Second post' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline and wait for posts to load
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');

    // Verify posts are displayed
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'First post' })).toBeVisible();
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'Second post' })).toBeVisible();
  });

  test('should edit own post', async ({ authenticatedPage: page }) => {
    // Create a post
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-ci="post-create-textarea"]', 'Original post content');

    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/posts') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      page.click('[data-ci="post-create-submit-button"]')
    ]);

    // Wait for post to appear
    await page.waitForTimeout(500);
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Original post content' });
    await expect(postCard).toBeVisible();

    // Click edit button
    await postCard.locator('[data-ci="post-edit-button"]').click();

    // Edit the content
    await page.fill('[data-ci="post-edit-textarea"]', 'Updated post content');
    await page.click('[data-ci="post-edit-save-button"]');

    // Verify updated content
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'Updated post content' })).toBeVisible();
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'Original post content' })).not.toBeVisible();
  });

  test('should delete own post', async ({ authenticatedPage: page }) => {
    // Create a post with unique content
    const uniqueContent = `Post to be deleted ${Date.now()}`;
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-ci="post-create-textarea"]', uniqueContent);

    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/posts') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      page.click('[data-ci="post-create-submit-button"]')
    ]);

    // Wait for post to appear
    await page.waitForTimeout(500);
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: uniqueContent });
    await expect(postCard).toBeVisible();

    // Click delete button
    await postCard.locator('[data-ci="post-delete-button"]').click();

    // Wait for dialog and confirm deletion by clicking the "Delete" button in the dialog
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify post is removed
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: uniqueContent })).not.toBeVisible();
  });

  test('should search for posts', async ({ authenticatedPage: page, request }) => {
    // Create posts with specific content
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Unique searchable content xyz123' },
      headers: { Cookie: cookieString },
    });

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Different content abc456' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline and wait for posts to load
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');

    // Search for specific content
    await page.fill('[data-ci="search-input"]', 'xyz123');
    await page.press('[data-ci="search-input"]', 'Enter');

    // Verify only matching post appears
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'Unique searchable content xyz123' })).toBeVisible();
    await expect(page.locator('[data-ci="post-card"]').filter({ hasText: 'Different content abc456' })).not.toBeVisible();
  });

  test('should display post metadata', async ({ authenticatedPage: page }) => {
    // Create a post
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-ci="post-create-textarea"]', 'Test post with metadata');

    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/posts') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      page.click('[data-ci="post-create-submit-button"]')
    ]);

    // Wait for post to appear
    await page.waitForTimeout(500);
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Test post with metadata' });
    await expect(postCard).toBeVisible();

    // Verify post metadata is displayed
    await expect(postCard.locator('[data-ci="post-author-name"]')).toBeVisible();
    await expect(postCard.locator('[data-ci="post-timestamp"]')).toBeVisible();
  });

  test('should show post actions for own posts', async ({ authenticatedPage: page }) => {
    // Create a post
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-ci="post-create-textarea"]', 'My own post');

    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/posts') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ),
      page.click('[data-ci="post-create-submit-button"]')
    ]);

    // Wait for post to appear
    await page.waitForTimeout(500);
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'My own post' });
    await expect(postCard).toBeVisible();

    // Verify action buttons are visible for own posts
    await expect(postCard.locator('[data-ci="post-edit-button"]')).toBeVisible();
    await expect(postCard.locator('[data-ci="post-delete-button"]')).toBeVisible();
  });

  test('should display timeline in reverse chronological order', async ({ authenticatedPage: page, request }) => {
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Create posts with delays to ensure different timestamps
    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Older post' },
      headers: { Cookie: cookieString },
    });

    await page.waitForTimeout(1000);

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Newer post' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline and wait for posts to load
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');

    // Get all post cards
    const posts = page.locator('[data-ci="post-card"]');

    // Verify newer post appears before older post
    const firstPost = posts.first();
    await expect(firstPost).toContainText('Newer post');
  });
});

import { test, expect } from './fixtures/test-fixture';

/**
 * Comments E2E Tests
 *
 * These tests verify the commenting functionality:
 * - Adding comments to posts
 * - Replying to comments
 * - Editing comments
 * - Deleting comments
 *
 * Uses data-ci attributes for reliable element selection
 */

test.describe('Comments', () => {
  test('should add a comment to a post', async ({ authenticatedPage: page, request }) => {
    // Create a post via API
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post with comments' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('domcontentloaded');

    // Find the post and expand comments by clicking the comments count button
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Post with comments' });
    await expect(postCard).toBeVisible();

    // Expand comments section (look for any comments toggle button)
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Add a comment
    await page.fill('[data-ci="comment-create-textarea"]', 'This is a test comment');
    await page.click('[data-ci="comment-create-submit-button"]');

    // Verify comment appears
    await expect(page.locator('[data-ci="comment-card"]').filter({ hasText: 'This is a test comment' })).toBeVisible();
  });


  test('should edit own comment', async ({ authenticatedPage: page, request }) => {
    // Create post and comment
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for edit comment test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Original comment text' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('domcontentloaded');

    // Find the post and expand comments
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Post for edit comment test' });
    await expect(postCard).toBeVisible();
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Wait a bit for comments to load after expanding
    await page.waitForTimeout(1000);

    // Edit the comment
    const commentCard = page.locator('[data-ci="comment-card"]').filter({ hasText: 'Original comment text' });
    await expect(commentCard).toBeVisible();
    await commentCard.locator('[data-ci="comment-edit-button"]').click();

    await page.fill('[data-ci="comment-edit-textarea"]', 'Updated comment text');
    await page.click('[data-ci="comment-edit-save-button"]');

    // Verify updated comment
    await expect(page.locator('[data-ci="comment-card"]').filter({ hasText: 'Updated comment text' })).toBeVisible();
    await expect(page.locator('[data-ci="comment-card"]').filter({ hasText: 'Original comment text' })).not.toBeVisible();
  });

  test('should delete own comment', async ({ authenticatedPage: page, request }) => {
    // Create post and comment
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for delete comment test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Comment to be deleted' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('domcontentloaded');

    // Find the post and expand comments
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Post for delete comment test' });
    await expect(postCard).toBeVisible();
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Wait for comments to load
    await page.waitForTimeout(1000);

    // Delete the comment
    const commentCard = page.locator('[data-ci="comment-card"]').filter({ hasText: 'Comment to be deleted' });
    await expect(commentCard).toBeVisible();
    await commentCard.locator('[data-ci="comment-delete-button"]').click();

    // Wait for dialog to appear and confirm deletion by clicking "Delete" button in dialog
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify comment is removed
    await expect(page.locator('[data-ci="comment-card"]').filter({ hasText: 'Comment to be deleted' })).not.toBeVisible();
  });

  // Nested comments are not supported - only root-level comments
  test.skip('should display nested comment structure', async ({ authenticatedPage: page, request }) => {
    // This feature is not implemented - only root-level comments are supported
  });

  test('should display comment metadata', async ({ authenticatedPage: page, request }) => {
    // Create post and comment
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for metadata test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Test comment with metadata' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('domcontentloaded');

    // Find the post and expand comments
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Post for metadata test' });
    await expect(postCard).toBeVisible();
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Verify comment metadata is displayed
    const commentCard = page.locator('[data-ci="comment-card"]').filter({ hasText: 'Test comment with metadata' });
    await expect(commentCard).toBeVisible();
    await expect(commentCard.locator('[data-ci="comment-author-name"]')).toBeVisible();
    await expect(commentCard.locator('[data-ci="comment-timestamp"]')).toBeVisible();
  });

  test('should show comment actions for own comments', async ({ authenticatedPage: page, request }) => {
    // Create post and comment
    const cookies = await page.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for actions test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'My own comment' },
      headers: { Cookie: cookieString },
    });

    // Navigate to timeline
    await page.goto('/timeline');
    await page.waitForLoadState('domcontentloaded');

    // Find the post and expand comments
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Post for actions test' });
    await expect(postCard).toBeVisible();
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Verify action buttons are visible for own comments
    const commentCard = page.locator('[data-ci="comment-card"]').filter({ hasText: 'My own comment' });
    await expect(commentCard).toBeVisible();
    await expect(commentCard.locator('[data-ci="comment-edit-button"]')).toBeVisible();
    await expect(commentCard.locator('[data-ci="comment-delete-button"]')).toBeVisible();
  });
});

import { test, expect } from './fixtures/test-fixture';

/**
 * Admin E2E Tests
 *
 * These tests verify admin-specific functionality:
 * - Admin can edit any user's post (UC19)
 * - Admin can delete any user's post (UC20)
 * - Admin can edit any user's comment (UC21)
 * - Admin can delete any user's comment (UC22)
 * - Admin views deleted posts/comments (UC23)
 * - Deleted items show "Deleted" badge (UC24)
 * - Edited content shows "Edited" indicator (UC25)
 * - Admin-edited content shows "Edited by admin" indicator (UC26)
 *
 * Uses data-ci attributes for reliable element selection
 */

test.describe('Admin Features', () => {
  test('should allow admin to edit any user post (UC19)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates a post
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Regular user post' },
      headers: { Cookie: cookieString },
    });

    // Admin navigates to timeline
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    // Find the regular user's post
    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Regular user post' });
    await expect(postCard).toBeVisible();

    // Admin should see edit button (even though they didn't create it)
    const editButton = postCard.locator('[data-ci="post-edit-button"]').first();
    await editButton.click();

    // Edit the content
    await adminPage.fill('[data-ci="post-edit-textarea"]', 'Admin edited this post');
    await adminPage.click('[data-ci="post-edit-save-button"]');

    // Verify edited content
    await expect(adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Admin edited this post' })).toBeVisible();
  });

  test('should allow admin to delete any user post (UC20)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates a post
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post to be deleted by admin' },
      headers: { Cookie: cookieString },
    });

    // Admin navigates to timeline
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    // Find the post
    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post to be deleted by admin' });
    await expect(postCard).toBeVisible();

    // Admin should see delete button
    await postCard.locator('[data-ci="post-delete-button"]').first().click();

    // Wait for dialog and confirm deletion by clicking "Delete" button in dialog
    await adminPage.waitForTimeout(500);
    await adminPage.getByRole('button', { name: 'Delete' }).last().click();

    // Post should still be visible for admin but marked as deleted
    await adminPage.waitForTimeout(1000);
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    const deletedPost = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post to be deleted by admin' });

    // Should show "Deleted" badge (UC24)
    await expect(deletedPost.locator('text=Deleted')).toBeVisible();
  });

  test('should allow admin to edit any user comment (UC21)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates a post and comment
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for admin comment edit test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Regular user comment' },
      headers: { Cookie: cookieString },
    });

    // Admin navigates to timeline
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    // Expand comments
    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post for admin comment edit test' });
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Wait for comments to load
    await adminPage.waitForTimeout(1000);

    // Find the comment
    const commentCard = adminPage.locator('[data-ci="comment-card"]').filter({ hasText: 'Regular user comment' });
    await expect(commentCard).toBeVisible();

    // Admin should see edit button
    await commentCard.locator('[data-ci="comment-edit-button"]').click();

    // Edit the comment
    await adminPage.fill('[data-ci="comment-edit-textarea"]', 'Admin edited this comment');
    await adminPage.click('[data-ci="comment-edit-save-button"]');

    // Verify edited content
    await expect(adminPage.locator('[data-ci="comment-card"]').filter({ hasText: 'Admin edited this comment' })).toBeVisible();
  });

  test('should allow admin to delete any user comment (UC22)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates a post and comment
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for admin comment delete test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Comment to be deleted by admin' },
      headers: { Cookie: cookieString },
    });

    // Admin navigates to timeline
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    // Expand comments
    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post for admin comment delete test' });
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Wait for comments to load
    await adminPage.waitForTimeout(1000);

    // Find the comment
    const commentCard = adminPage.locator('[data-ci="comment-card"]').filter({ hasText: 'Comment to be deleted by admin' });
    await expect(commentCard).toBeVisible();

    // Admin should see delete button
    await commentCard.locator('[data-ci="comment-delete-button"]').click();

    // Wait for dialog and confirm deletion by clicking "Delete" button in dialog
    await adminPage.waitForTimeout(500);
    await adminPage.getByRole('button', { name: 'Delete' }).last().click();

    // Wait for deletion to complete
    await adminPage.waitForTimeout(500);

    // Comment should be removed
    await expect(commentCard).not.toBeVisible();
  });

  test('should display deleted posts only for admin (UC23, UC24)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Create and delete a post
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post to check deleted visibility' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    // Delete the post
    await request.delete(`http://localhost:3000/api/posts/${postId}`, {
      headers: { Cookie: cookieString },
    });

    // Admin views timeline - should see deleted post
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    const deletedPost = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post to check deleted visibility' });
    await expect(deletedPost).toBeVisible();

    // Should show "Deleted" badge (UC24)
    await expect(deletedPost.locator('text=Deleted')).toBeVisible();

    // Regular user views timeline - should NOT see deleted post
    await userPage.goto('/timeline');
    await userPage.waitForLoadState('domcontentloaded');

    await expect(userPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post to check deleted visibility' })).not.toBeVisible();
  });

  test('should show "Edited" indicator for edited posts (UC25)', async ({ authenticatedRegularUser: page }) => {
    // Create a post
    await page.goto('/timeline');
    await page.fill('[data-ci="post-create-textarea"]', 'Original content for edit indicator test');
    await page.click('[data-ci="post-create-submit-button"]');

    // Edit the post
    const postCard = page.locator('[data-ci="post-card"]').filter({ hasText: 'Original content for edit indicator test' });
    await postCard.locator('[data-ci="post-edit-button"]').first().click();
    await page.fill('[data-ci="post-edit-textarea"]', 'Edited content');
    await page.click('[data-ci="post-edit-save-button"]');

    // Verify "Edited" indicator is shown (use more specific selector to avoid matching post content)
    const editedPost = page.locator('[data-ci="post-card"]').filter({ hasText: 'Edited content' });
    await expect(editedPost.locator('span:has-text("• Edited")')).toBeVisible();
  });

  test('should show "Edited by admin" indicator when admin edits (UC26)', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates a post
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post to be edited by admin for indicator test' },
      headers: { Cookie: cookieString },
    });

    // Admin edits the post
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post to be edited by admin for indicator test' });
    await postCard.locator('[data-ci="post-edit-button"]').first().click();
    await adminPage.fill('[data-ci="post-edit-textarea"]', 'Admin edited content');

    // Capture the API response to debug
    const responsePromise = adminPage.waitForResponse(response =>
      response.url().includes('/api/posts/') && response.request().method() === 'PATCH'
    );
    await adminPage.click('[data-ci="post-edit-save-button"]');
    const response = await responsePromise;
    const responseBody = await response.json();
    console.log('[E2E Test] Post edit response:', JSON.stringify(responseBody, null, 2));
    console.log('[E2E Test] editedByAdmin flag:', responseBody?.data?.post?.editedByAdmin);

    // Verify "Edited by admin" indicator is shown
    const editedPost = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Admin edited content' });
    await expect(editedPost.locator('text=Edited by admin')).toBeVisible();

    // Regular user should also see "Edited by admin" indicator
    await userPage.goto('/timeline');
    await userPage.waitForLoadState('domcontentloaded');

    const userViewPost = userPage.locator('[data-ci="post-card"]').filter({ hasText: 'Admin edited content' });
    await expect(userViewPost.locator('text=Edited by admin')).toBeVisible();
  });

  test('should show "Edited by admin" for admin-edited comments', async ({ authenticatedAdminUser: adminPage, authenticatedRegularUser: userPage, request }) => {
    // Regular user creates post and comment
    const cookies = await userPage.context().cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const postResponse = await request.post('http://localhost:3000/api/posts', {
      data: { content: 'Post for admin comment edit indicator test' },
      headers: { Cookie: cookieString },
    });

    const postData = await postResponse.json();
    const postId = postData.data.post.id;

    await request.post(`http://localhost:3000/api/posts/${postId}/comments`, {
      data: { content: 'Comment to be edited by admin' },
      headers: { Cookie: cookieString },
    });

    // Admin edits the comment
    await adminPage.goto('/timeline');
    await adminPage.waitForLoadState('domcontentloaded');

    const postCard = adminPage.locator('[data-ci="post-card"]').filter({ hasText: 'Post for admin comment edit indicator test' });
    await postCard.locator('button').filter({ hasText: /comment/i }).click();

    // Wait for comments to load
    await adminPage.waitForTimeout(1000);

    const commentCard = adminPage.locator('[data-ci="comment-card"]').filter({ hasText: 'Comment to be edited by admin' });
    await commentCard.locator('[data-ci="comment-edit-button"]').click();
    await adminPage.fill('[data-ci="comment-edit-textarea"]', 'Admin edited this comment');
    await adminPage.click('[data-ci="comment-edit-save-button"]');

    // Verify "Edited by admin" indicator
    const editedComment = adminPage.locator('[data-ci="comment-card"]').filter({ hasText: 'Admin edited this comment' });
    await expect(editedComment.locator('text=Edited by admin')).toBeVisible();
  });
});

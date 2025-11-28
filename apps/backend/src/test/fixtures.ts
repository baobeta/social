import { db } from './setup.js';
import { users, posts, comments, type NewUser, type NewPost, type NewComment } from '../db/schema/index.js';
import { hashPassword } from '../lib/password.js';
import { generateInitials } from '../lib/initials.js';

/**
 * Test fixtures and factory functions for creating test data
 *
 * IMPORTANT: This module uses the test database connection from setup.js
 * to ensure test data doesn't pollute the development database.
 */

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: Partial<NewUser>) {
  const fullName = overrides?.fullName || 'Test User';
  const defaultUser: NewUser = {
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    password: await hashPassword('password123'),
    fullName,
    displayName: 'Tester',
    initials: generateInitials(fullName),
    role: 'user',
  };

  const userData = { ...defaultUser, ...overrides };
  // Regenerate initials if fullName was overridden
  if (overrides?.fullName && !overrides?.initials) {
    userData.initials = generateInitials(overrides.fullName);
  }

  const [user] = await db.insert(users).values(userData).returning();
  return user!;
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number) {
  const userPromises = Array.from({ length: count }, (_, i) =>
    createTestUser({
      username: `testuser_${Date.now()}_${i}`,
      fullName: `Test User ${i}`,
    })
  );
  return Promise.all(userPromises);
}

/**
 * Create an admin user
 */
export async function createAdminUser(overrides?: Partial<NewUser>) {
  return createTestUser({
    username: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    role: 'admin',
    ...overrides,
  });
}

/**
 * Create a test post in the database
 */
export async function createTestPost(
  authorId: string,
  overrides?: Partial<NewPost>
) {
  const defaultPost: NewPost = {
    content: `Test post content ${Date.now()}`,
    authorId,
  };

  const postData = { ...defaultPost, ...overrides };

  const [post] = await db.insert(posts).values(postData).returning();
  return post!;
}

/**
 * Create multiple test posts for a user
 */
export async function createTestPosts(authorId: string, count: number) {
  const postPromises = Array.from({ length: count }, (_, i) =>
    createTestPost(authorId, {
      content: `Test post ${i + 1} content`,
    })
  );
  return Promise.all(postPromises);
}

/**
 * Create a test comment in the database
 */
export async function createTestComment(
  postId: string,
  authorId: string,
  overrides?: Partial<NewComment>
) {
  const defaultComment: NewComment = {
    content: `Test comment content ${Date.now()}`,
    postId,
    authorId,
    parentCommentId: null,
  };

  const commentData = { ...defaultComment, ...overrides };

  const [comment] = await db.insert(comments).values(commentData).returning();
  return comment!;
}

/**
 * Create multiple test comments for a post
 */
export async function createTestComments(
  postId: string,
  authorId: string,
  count: number
) {
  const commentPromises = Array.from({ length: count }, (_, i) =>
    createTestComment(postId, authorId, {
      content: `Test comment ${i + 1} content`,
    })
  );
  return Promise.all(commentPromises);
}

/**
 * Create a test reply (comment with parentCommentId)
 */
export async function createTestReply(
  postId: string,
  authorId: string,
  parentCommentId: string,
  overrides?: Partial<NewComment>
) {
  return createTestComment(postId, authorId, {
    ...overrides,
    parentCommentId,
  });
}

/**
 * Sample user data for testing (without passwords hashed)
 */
export const testUserData = {
  valid: {
    username: 'validuser',
    password: 'ValidPass123!',
    fullName: 'Valid User',
    displayName: 'Valid',
  },
  withoutDisplayName: {
    username: 'nodisplay',
    password: 'Password123!',
    fullName: 'No Display User',
  },
  admin: {
    username: 'adminuser',
    password: 'AdminPass123!',
    fullName: 'Admin User',
    role: 'admin' as const,
  },
};

import { db } from './setup.js';
import { users, posts, type NewUser, type NewPost } from '../db/schema/index.js';
import { hashPassword } from '../lib/password.js';

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
  const defaultUser: NewUser = {
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    password: await hashPassword('password123'),
    fullName: 'Test User',
    displayName: 'Tester',
    role: 'user',
  };

  const userData = { ...defaultUser, ...overrides };

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

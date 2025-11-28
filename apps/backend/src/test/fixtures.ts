import { db } from './setup.js';
import { users, type NewUser } from '../db/schema/index.js';
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

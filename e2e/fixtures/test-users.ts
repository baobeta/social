import type { APIRequestContext } from '@playwright/test';
import { registerUser, type TestUser } from '../utils/api-helpers';

/**
 * Predefined test users for E2E tests
 *
 * These users can be seeded into the database at the start of tests
 * to avoid creating new users in every test.
 */

export interface SeededUser extends TestUser {
  id?: string;
  role: string;
}

/**
 * Predefined test users
 */
export const TEST_USERS = {
  /**
   * Regular user for standard tests
   */
  regular: {
    username: 'testuser_regular',
    password: 'TestPassword123!',
    fullName: 'Regular Test User',
    displayName: 'Regular Tester',
    role: 'user',
  } as SeededUser,

  /**
   * Admin user for admin-specific tests
   */
  admin: {
    username: 'testuser_admin',
    password: 'TestPassword123!',
    fullName: 'Admin Test User',
    displayName: 'Admin Tester',
    role: 'admin',
  } as SeededUser,

  /**
   * Second regular user for interaction tests (following, commenting, etc.)
   */
  regular2: {
    username: 'testuser_regular2',
    password: 'TestPassword123!',
    fullName: 'Second Test User',
    displayName: 'Second Tester',
    role: 'user',
  } as SeededUser,
} as const;

/**
 * Create a dynamic test user with a unique timestamp
 * Use this when you need a fresh user that won't conflict with existing data
 */
export function createDynamicUser(suffix?: string): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uniqueSuffix = suffix ? `_${suffix}` : '';

  return {
    username: `testuser_${timestamp}_${random}${uniqueSuffix}`,
    password: 'TestPassword123!',
    fullName: 'Dynamic Test User',
    displayName: 'Dynamic Tester',
  };
}

/**
 * Seed a predefined user into the database
 * This will attempt to register the user, ignoring errors if user already exists
 */
export async function seedUser(
  request: APIRequestContext,
  user: SeededUser
): Promise<SeededUser> {
  try {
    const response = await registerUser(request, user);
    return {
      ...user,
      id: response.data.user.id,
    };
  } catch (error) {
    // User might already exist, that's okay
    // In a real setup, you might want to check the error message
    console.log(`User ${user.username} might already exist, continuing...`);
    return user;
  }
}

/**
 * Seed all predefined test users
 */
export async function seedAllUsers(request: APIRequestContext): Promise<void> {
  await Promise.all([
    seedUser(request, TEST_USERS.regular),
    seedUser(request, TEST_USERS.admin),
    seedUser(request, TEST_USERS.regular2),
  ]);
}

/**
 * Get a test user by type
 */
export function getTestUser(type: keyof typeof TEST_USERS): SeededUser {
  return TEST_USERS[type];
}

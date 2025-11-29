import type { APIRequestContext } from '@playwright/test';
import { registerUser, type TestUser } from '../utils/api-helpers';
import { seedUserToDatabase, type SeedUserData } from '../utils/db-seed';

/**
 * Predefined test users for E2E tests
 *
 * These users can be seeded into the database at the start of tests
 * to avoid creating new users in every test.
 */

export interface SeededUser extends TestUser {
  id?: string;
  role: 'user' | 'admin';
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
 *
 * For admin users, this bypasses the API and inserts directly into the database
 * because the registration API doesn't allow setting the role field for security reasons.
 *
 * For regular users, we use the API for more realistic testing.
 */
export async function seedUser(
  request: APIRequestContext,
  user: SeededUser
): Promise<SeededUser> {
  // If user is admin, seed directly to database to set role correctly
  if (user.role === 'admin') {
    try {
      const userId = await seedUserToDatabase({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
      });
      return {
        ...user,
        id: userId,
      };
    } catch (error) {
      console.log(`User ${user.username} might already exist, continuing...`);
      return user;
    }
  }

  // For regular users, use API registration
  try {
    const response = await registerUser(request, user);
    return {
      ...user,
      id: response.data.user.id,
    };
  } catch (error) {
    // User might already exist, that's okay
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

import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, type User } from '../../db/schema/index.js';

/**
 * Repository for user-related database operations
 * Handles all database queries for user profile management
 */
export class UserRepository {
  /**
   * Find a user by ID
   * @param id - User ID
   * @returns User object or undefined if not found
   */
  async findById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * Update user profile fields
   * @param id - User ID
   * @param data - Fields to update (fullName, displayName, initials)
   * @returns Updated user object
   */
  async updateProfile(
    id: string,
    data: { fullName?: string; displayName?: string | null; initials?: string }
  ): Promise<User> {
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0]!;
  }

  /**
   * Find a user by username
   * @param username - Username to search for
   * @returns User object or undefined if not found
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0];
  }
}

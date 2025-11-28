import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { users, type NewUser, type User } from '../../db/schema/index.ts';

export class AuthRepository {
  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0];
  }

  /**
   * Find a user by ID
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
   * Create a new user
   */
  async create(userData: NewUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0]!;
  }

  /**
   * Check if a username already exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return !!user;
  }
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../../apps/backend/src/db/schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Use the same salt rounds as the backend (10)
const SALT_ROUNDS = 10;

/**
 * Database seeding utility for E2E tests
 *
 * This bypasses the API registration to create users with specific roles
 * directly in the database, which is needed for admin users.
 */

export interface SeedUserData {
  username: string;
  password: string;
  fullName: string;
  displayName?: string;
  role: 'user' | 'admin';
}

/**
 * Seed a user directly into the database with the specified role
 * This is the proper way to create admin users for testing
 */
export async function seedUserToDatabase(userData: SeedUserData): Promise<string> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/social_media_e2e';
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Check if user already exists first
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUser.length > 0) {
      // If user exists with matching role, just return it
      if (existingUser[0].role === userData.role) {
        console.log(`[DB Seed] User ${userData.username} already exists with correct role ${userData.role}`);
        await client.end();
        return existingUser[0].id;
      }

      // If role doesn't match, update the role
      console.log(`[DB Seed] Updating user ${userData.username} role from ${existingUser[0].role} to ${userData.role}`);
      await db
        .update(users)
        .set({ role: userData.role })
        .where(eq(users.username, userData.username));

      await client.end();
      return existingUser[0].id;
    }

    // Hash the password using bcrypt with the same salt rounds as the backend
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    console.log(`[DB Seed] Creating new user ${userData.username} with role ${userData.role}...`);

    // Insert user directly into database with the specified role
    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: hashedPassword,
        fullName: userData.fullName,
        displayName: userData.displayName || null,
        role: userData.role,
      })
      .returning();

    console.log(`[DB Seed] Successfully created user ${userData.username} with role ${userData.role}, ID: ${newUser.id}`);

    // Close the connection to ensure the transaction is committed
    await client.end();

    return newUser.id;
  } catch (error) {
    console.error(`[DB Seed] Error seeding user ${userData.username}:`, error);
    await client.end();
    throw error;
  }
}

/**
 * Seed multiple users to the database
 */
export async function seedUsersToDatabase(usersData: SeedUserData[]): Promise<Record<string, string>> {
  const userIds: Record<string, string> = {};

  for (const userData of usersData) {
    const userId = await seedUserToDatabase(userData);
    userIds[userData.username] = userId;
  }

  return userIds;
}

/**
 * Clean up test users from the database
 */
export async function cleanupTestUsers(usernames: string[]): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/social_media_e2e';
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    for (const username of usernames) {
      await db.delete(users).where(eq(users.username, username));
      console.log(`[DB Seed] Deleted user ${username}`);
    }
    await client.end();
  } catch (error) {
    await client.end();
    throw error;
  }
}

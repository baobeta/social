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
  // Use E2E_DATABASE_URL if available (matches backend config), otherwise DATABASE_URL, with fallback
  const connectionString =
    process.env.E2E_DATABASE_URL ||
    'postgresql://baolequoc@localhost:5432/social_media_e2e';

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Hash the password using bcrypt with the same salt rounds as the backend
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`[DB Seed] User ${userData.username} exists, updating password and role to ensure correctness...`);

      // Always update password and role to ensure they match what tests expect
      // This is critical when password hashing logic changes
      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: userData.role,
        })
        .where(eq(users.username, userData.username));

      await client.end();
      return existingUser[0].id;
    }

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
  // Use E2E_DATABASE_URL if available (matches backend config), otherwise DATABASE_URL, with fallback
  const connectionString =
    process.env.E2E_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://baolequoc@localhost:5432/social_media_e2e';

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

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index.js';
import { config } from '../lib/config.js';

/**
 * Query counter utility for detecting N+1 issues in tests
 *
 * Usage:
 * const counter = createQueryCounter();
 * // ... run code using counter.db
 * expect(counter.count).toBe(1); // Assert expected query count
 */

let queryLog: string[] = [];

/**
 * Create a database connection with query logging enabled
 */
export function createQueryCounterDb() {
  queryLog = [];

  const client = postgres(config.database.url, {
    max: 5,
    onnotice: () => {}, // Suppress notices
  });

  const db = drizzle(client, {
    schema,
    logger: {
      logQuery(query: string) {
        queryLog.push(query);
      },
    },
  });

  return {
    db,
    getQueryCount: () => queryLog.length,
    getQueries: () => [...queryLog],
    reset: () => {
      queryLog = [];
    },
    close: async () => {
      await client.end();
    },
  };
}

/**
 * Helper function to measure queries for a specific operation
 * Uses a fresh db connection with logging enabled
 */
export async function countQueries<T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<{ result: T; queryCount: number; queries: string[] }> {
  const counter = createQueryCounterDb();

  try {
    // NOTE: It quite "dâm dâm" in vietnamese
    // Overwrite db connection to get query count
    // We only support it for test purposes
    const result = await operation(counter.db);

    return {
      result,
      queryCount: counter.getQueryCount(),
      queries: counter.getQueries(),
    };
  } finally {
    await counter.close();
  }
}

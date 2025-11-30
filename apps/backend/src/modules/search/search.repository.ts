import { sql, eq, and, or, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, posts, type User, type Post } from '../../db/schema/index.js';

/**
 * Repository for search operations
 * Uses PostgreSQL full-text search with tsvector and tsquery
 */
export class SearchRepository {
  /**
   * Escape a single term for tsquery by removing special chars and wrapping in quotes
   * PostgreSQL tsquery special characters: ! & | ( ) : cannot be used even in quotes
   * We remove them before quoting to avoid syntax errors
   */
  private escapeTsQueryTerm(term: string): string {
    if (term.length === 0) return '';
    // Remove special tsquery characters that break even when quoted
    const cleaned = term.replace(/[!&|():]/g, '').trim();
    if (cleaned.length === 0) return '';
    // Escape double quotes by doubling them, then wrap entire term in quotes
    return `"${cleaned.replace(/"/g, '""')}"`;
  }

  /**
   * Convert search query to safe tsquery format with prefix matching
   * Handles special characters by quoting each term
   */
  private buildTsQuery(query: string): string {
    const cleaned = query.trim();
    
    if (cleaned.length === 0) {
      return '""';
    }
    
    // Split into terms and escape each one
    const terms = cleaned
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => this.escapeTsQueryTerm(term))
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`) // Add prefix matching
      .join(' & '); // Use AND logic
    
    if (!terms || terms.trim().length === 0) {
      return '""';
    }
    
    return terms;
  }

  /**
   * Search users by username or full name using full-text search
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of users with relevance scores
   */
  async searchUsers(
    query: string,
    limit: number,
    offset: number
  ): Promise<Array<User & { relevance: number }>> {
    const tsQuery = this.buildTsQuery(query);

    const result = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        fullName: users.fullName,
        displayName: users.displayName,
        initials: users.initials,
        role: users.role,
        searchVector: users.searchVector,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Calculate relevance score using ts_rank
        relevance: sql<number>`ts_rank(${users.searchVector}, to_tsquery('english', ${sql.raw(`'${tsQuery.replace(/'/g, "''")}'`)}))`,
      })
      .from(users)
      .where(
        sql`${users.searchVector} @@ to_tsquery('english', ${sql.raw(`'${tsQuery.replace(/'/g, "''")}'`)})`
      )
      .orderBy(
        desc(sql`ts_rank(${users.searchVector}, to_tsquery('english', ${sql.raw(`'${tsQuery.replace(/'/g, "''")}'`)}))`),
        desc(users.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Search posts by content or author username using full-text search
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of posts with author information and relevance scores
   */
  async searchPosts(
    query: string,
    limit: number,
    offset: number
  ): Promise<
    Array<
      Post & {
        relevance: number;
        author: {
          id: string;
          username: string;
          fullName: string;
          displayName: string | null;
        };
      }
    >
  > {
    const tsQuery = this.buildTsQuery(query);
    const escapedQuery = tsQuery.replace(/'/g, "''");

    const result = await db
      .select({
        // Post fields
        id: posts.id,
        content: posts.content,
        authorId: posts.authorId,
        isDeleted: posts.isDeleted,
        deletedAt: posts.deletedAt,
        deletedBy: posts.deletedBy,
        isEdited: posts.isEdited,
        editedAt: posts.editedAt,
        editedBy: posts.editedBy,
        searchVector: posts.searchVector,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        // Combined relevance score from post content and author username
        relevance: sql<number>`
          ts_rank(${posts.searchVector}, to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})) +
          ts_rank(${users.searchVector}, to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})) * 0.5
        `,
        // Author fields
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          displayName: users.displayName,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          // Search in either post content OR author username/fullname
          or(
            sql`${posts.searchVector} @@ to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})`,
            sql`${users.searchVector} @@ to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})`
          ),
          eq(posts.isDeleted, false) // Exclude soft-deleted posts
        )
      )
      .orderBy(
        // Order by combined relevance score
        desc(sql`
          ts_rank(${posts.searchVector}, to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})) +
          ts_rank(${users.searchVector}, to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})) * 0.5
        `),
        desc(posts.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Count total number of users matching search query
   * @param query - Search query string
   * @returns Count of matching users
   */
  async countUsers(query: string): Promise<number> {
    const tsQuery = this.buildTsQuery(query);
    const escapedQuery = tsQuery.replace(/'/g, "''");

    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        sql`${users.searchVector} @@ to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})`
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Count total number of posts matching search query (by content or author username)
   * @param query - Search query string
   * @returns Count of matching posts
   */
  async countPosts(query: string): Promise<number> {
    const tsQuery = this.buildTsQuery(query);
    const escapedQuery = tsQuery.replace(/'/g, "''");

    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          // Search in either post content OR author username/fullname
          or(
            sql`${posts.searchVector} @@ to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})`,
            sql`${users.searchVector} @@ to_tsquery('english', ${sql.raw(`'${escapedQuery}'`)})`
          ),
          eq(posts.isDeleted, false)
        )
      );

    return result[0]?.count ?? 0;
  }
}

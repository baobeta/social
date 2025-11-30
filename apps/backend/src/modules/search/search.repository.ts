import { sql, eq, and, or, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, posts, type User, type Post } from '../../db/schema/index.js';

/**
 * Repository for search operations
 * Uses PostgreSQL full-text search with tsvector and tsquery
 */
export class SearchRepository {
  /**
   * Escape special characters in a term for tsquery
   * PostgreSQL tsquery special characters: : & | ! ( )
   * We wrap terms in quotes to escape special characters
   */
  private escapeTsQueryTerm(term: string): string {
    if (term.length === 0) return term;
    return `"${term.replace(/"/g, '""')}"`;
  }

  /**
   * Convert search query to safe tsquery format
   * Escapes special characters and adds prefix matching
   */
  private buildTsQuery(query: string): string {
    return query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${this.escapeTsQueryTerm(term)}:*`)
      .join(' & ');
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
        relevance: sql<number>`ts_rank(${users.searchVector}, to_tsquery('english', ${tsQuery}))`,
      })
      .from(users)
      .where(
        sql`${users.searchVector} @@ to_tsquery('english', ${tsQuery})`
      )
      .orderBy(
        desc(sql`ts_rank(${users.searchVector}, to_tsquery('english', ${tsQuery}))`),
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
          ts_rank(${posts.searchVector}, to_tsquery('english', ${tsQuery})) +
          ts_rank(${users.searchVector}, to_tsquery('english', ${tsQuery})) * 0.5
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
            sql`${posts.searchVector} @@ to_tsquery('english', ${tsQuery})`,
            sql`${users.searchVector} @@ to_tsquery('english', ${tsQuery})`
          ),
          eq(posts.isDeleted, false) // Exclude soft-deleted posts
        )
      )
      .orderBy(
        // Order by combined relevance score
        desc(sql`
          ts_rank(${posts.searchVector}, to_tsquery('english', ${tsQuery})) +
          ts_rank(${users.searchVector}, to_tsquery('english', ${tsQuery})) * 0.5
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

    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        sql`${users.searchVector} @@ to_tsquery('english', ${tsQuery})`
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
            sql`${posts.searchVector} @@ to_tsquery('english', ${tsQuery})`,
            sql`${users.searchVector} @@ to_tsquery('english', ${tsQuery})`
          ),
          eq(posts.isDeleted, false)
        )
      );

    return result[0]?.count ?? 0;
  }
}

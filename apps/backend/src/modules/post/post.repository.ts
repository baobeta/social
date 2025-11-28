import { eq, desc, and, sql } from 'drizzle-orm';
import { db as defaultDb } from '../../db/index.js';
import { posts, users, type Post, type NewPost } from '../../db/schema/index.js';
import type { drizzle } from 'drizzle-orm/postgres-js';
import { env } from 'process';

/**
 * Repository for post-related database operations
 * Handles all database queries for post management
 */
export class PostRepository {
  private db: ReturnType<typeof drizzle>;

  // NOTE: only use pass db into constructor for testing
  constructor(db?: ReturnType<typeof drizzle>) {
    if(env?.NODE_ENV !== 'test' && db) {
      throw('PostRepository with db should only be used for testing');
    }
    this.db = db || defaultDb;
  }
  /**
   * Create a new post
   * @param data - Post data (content, authorId)
   * @returns Created post
   */
  async create(data: NewPost): Promise<Post> {
    const [post] = await this.db.insert(posts).values(data).returning();
    return post!;
  }

  /**
   * Find post by ID
   * @param id - Post ID
   * @returns Post with author information or undefined
   */
  async findById(id: string): Promise<
    | (Post & {
        author: {
          id: string;
          username: string;
          fullName: string;
          displayName: string | null;
        };
      })
    | undefined
  > {
    const result = await this.db
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
      .where(eq(posts.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * Get all posts for timeline (global feed)
   * Sorted by creation date (newest first)
   * Excludes soft-deleted posts
   * @param limit - Maximum number of posts to return
   * @param offset - Number of posts to skip
   * @returns Array of posts with author information
   */
  async getTimeline(
    limit: number,
    offset: number
  ): Promise<
    Array<
      Post & {
        author: {
          id: string;
          username: string;
          fullName: string;
          displayName: string | null;
        };
      }
    >
  > {
    return await this.db
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
      .where(eq(posts.isDeleted, false))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count total number of posts in timeline
   * @returns Total count of non-deleted posts
   */
  async countTimeline(): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(eq(posts.isDeleted, false));

    return result[0]?.count ?? 0;
  }

  /**
   * Update post content
   * @param id - Post ID
   * @param content - New content
   * @param userId - User making the update (for tracking)
   * @returns Updated post
   */
  async update(id: string, content: string, userId: string): Promise<Post> {
    const [post] = await this.db
      .update(posts)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
        editedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return post!;
  }

  /**
   * Soft delete a post
   * @param id - Post ID
   * @param userId - User performing the deletion
   * @returns Updated post with soft delete fields set
   */
  async softDelete(id: string, userId: string): Promise<Post> {
    const [post] = await this.db
      .update(posts)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return post!;
  }

  /**
   * Get posts by author ID
   * @param authorId - Author user ID
   * @param limit - Maximum number of posts
   * @param offset - Number of posts to skip
   * @returns Array of posts with author information
   */
  async getByAuthor(
    authorId: string,
    limit: number,
    offset: number
  ): Promise<
    Array<
      Post & {
        author: {
          id: string;
          username: string;
          fullName: string;
          displayName: string | null;
        };
      }
    >
  > {
    return await this.db
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
      .where(and(eq(posts.authorId, authorId), eq(posts.isDeleted, false)))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Check if user is the author of a post
   * @param postId - Post ID
   * @param userId - User ID
   * @returns True if user is the author
   */
  async isAuthor(postId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
      .limit(1);

    return result.length > 0;
  }
}

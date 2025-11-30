import { eq, desc, and, sql, isNull, inArray } from 'drizzle-orm';
import { db as defaultDb } from '../../db/index.js';
import { comments, users, type Comment, type NewComment } from '../../db/schema/index.js';
import type { drizzle } from 'drizzle-orm/postgres-js';

/**
 * Repository for comment-related database operations
 * Handles all database queries for comment management
 * Uses JOINs to prevent N+1 query issues
 */
export class CommentRepository {
  private db: ReturnType<typeof drizzle>;

  constructor(db?: ReturnType<typeof drizzle>) {
    this.db = db || defaultDb;
  }

  /**
   * Create a new comment
   * @param data - Comment data (content, authorId, postId, parentCommentId)
   * @returns Created comment
   */
  async create(data: NewComment): Promise<Comment> {
    const [comment] = await this.db.insert(comments).values(data).returning();
    return comment!;
  }

  /**
   * Find comment by ID with author information
   * Uses JOIN to prevent N+1
   * @param id - Comment ID
   * @returns Comment with author information or undefined
   */
  async findById(id: string): Promise<
    | (Comment & {
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
        // Comment fields
        id: comments.id,
        content: comments.content,
        postId: comments.postId,
        authorId: comments.authorId,
        parentCommentId: comments.parentCommentId,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        deletedBy: comments.deletedBy,
        isEdited: comments.isEdited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        searchVector: comments.searchVector,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        // Author fields - fetched via JOIN to prevent N+1
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          displayName: users.displayName,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * Get top-level comments for a post (not replies)
   * Sorted by date DESC (newest first)
   * Uses JOIN to prevent N+1
   * @param postId - Post ID
   * @param limit - Maximum number of comments to return
   * @param offset - Number of comments to skip
   * @returns Array of comments with author information
   */
  async getByPostId(
    postId: string,
    limit: number,
    offset: number
  ): Promise<
    Array<
      Comment & {
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
        // Comment fields
        id: comments.id,
        content: comments.content,
        postId: comments.postId,
        authorId: comments.authorId,
        parentCommentId: comments.parentCommentId,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        deletedBy: comments.deletedBy,
        isEdited: comments.isEdited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        searchVector: comments.searchVector,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        // Author fields - fetched via JOIN to prevent N+1
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          displayName: users.displayName,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.postId, postId),
          eq(comments.isDeleted, false),
          isNull(comments.parentCommentId) // Only top-level comments
        )
      )
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count total top-level comments for a post
   * @param postId - Post ID
   * @returns Total count of non-deleted top-level comments
   */
  async countByPostId(postId: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        and(
          eq(comments.postId, postId),
          eq(comments.isDeleted, false),
          isNull(comments.parentCommentId)
        )
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Count comments for multiple posts in a single query (prevents N+1)
   * @param postIds - Array of post IDs
   * @returns Map of postId to comment count
   */
  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const results = await this.db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        and(
          inArray(comments.postId, postIds),
          eq(comments.isDeleted, false),
          isNull(comments.parentCommentId)
        )
      )
      .groupBy(comments.postId);

    const countMap = new Map<string, number>();
    for (const result of results) {
      countMap.set(result.postId, result.count);
    }

    // Ensure all postIds are in the map, even if they have 0 comments
    for (const postId of postIds) {
      if (!countMap.has(postId)) {
        countMap.set(postId, 0);
      }
    }

    return countMap;
  }

  /**
   * Get replies for a comment
   * Sorted by date DESC (newest first)
   * Uses JOIN to prevent N+1
   * @param parentCommentId - Parent comment ID
   * @param limit - Maximum number of replies to return
   * @param offset - Number of replies to skip
   * @returns Array of replies with author information
   */
  async getReplies(
    parentCommentId: string,
    limit: number,
    offset: number
  ): Promise<
    Array<
      Comment & {
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
        // Comment fields
        id: comments.id,
        content: comments.content,
        postId: comments.postId,
        authorId: comments.authorId,
        parentCommentId: comments.parentCommentId,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        deletedBy: comments.deletedBy,
        isEdited: comments.isEdited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        searchVector: comments.searchVector,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        // Author fields - fetched via JOIN to prevent N+1
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          displayName: users.displayName,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.parentCommentId, parentCommentId),
          eq(comments.isDeleted, false)
        )
      )
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count replies for a comment
   * @param parentCommentId - Parent comment ID
   * @returns Total count of non-deleted replies
   */
  async countReplies(parentCommentId: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        and(
          eq(comments.parentCommentId, parentCommentId),
          eq(comments.isDeleted, false)
        )
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Count replies for multiple comments in a single query (prevents N+1)
   * @param commentIds - Array of parent comment IDs
   * @returns Map of commentId to reply count
   */
  async countRepliesByCommentIds(commentIds: string[]): Promise<Map<string, number>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const results = await this.db
      .select({
        parentCommentId: comments.parentCommentId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        and(
          inArray(comments.parentCommentId, commentIds),
          eq(comments.isDeleted, false)
        )
      )
      .groupBy(comments.parentCommentId);

    const countMap = new Map<string, number>();
    for (const result of results) {
      if (result.parentCommentId) {
        countMap.set(result.parentCommentId, result.count);
      }
    }

    for (const commentId of commentIds) {
      if (!countMap.has(commentId)) {
        countMap.set(commentId, 0);
      }
    }

    return countMap;
  }

  /**
   * Update comment content
   * @param id - Comment ID
   * @param content - New content
   * @param userId - User ID who is editing
   * @returns Updated comment
   */
  async update(id: string, content: string, userId: string): Promise<Comment> {
    const [comment] = await this.db
      .update(comments)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
        editedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    return comment!;
  }

  /**
   * Soft delete a comment
   * @param id - Comment ID
   * @param userId - User ID who is deleting
   * @returns Updated comment
   */
  async softDelete(id: string, userId: string): Promise<Comment> {
    const [comment] = await this.db
      .update(comments)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    return comment!;
  }

  /**
   * Check if user is the author of a comment
   * @param commentId - Comment ID
   * @param userId - User ID
   * @returns True if user is the author
   */
  async isAuthor(commentId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.authorId, userId)))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Check if a comment belongs to a specific post
   * @param commentId - Comment ID
   * @param postId - Post ID
   * @returns True if comment belongs to post
   */
  async belongsToPost(commentId: string, postId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.postId, postId)))
      .limit(1);

    return result.length > 0;
  }
}

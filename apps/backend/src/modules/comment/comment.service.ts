import { CommentRepository } from './comment.repository.js';
import type {
  CreateCommentDto,
  UpdateCommentDto,
  CreateCommentResponse,
  GetCommentResponse,
  UpdateCommentResponse,
  GetCommentsResponse,
  GetRepliesResponse,
  CommentResponse,
} from './comment.dto.js';
import { AuthorizationService, type AuthUser } from '../../lib/authorization.js';
import { cacheService } from '../../lib/cache.js';

/**
 * Service for comment business logic
 * Handles comment operations with validation and authorization
 */
export class CommentService {
  private repository: CommentRepository;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly COMMENT_CACHE_PREFIX = 'comment:';
  private readonly COMMENTS_LIST_PREFIX = 'comments:post:';
  private readonly REPLIES_LIST_PREFIX = 'replies:comment:';

  constructor(repository: CommentRepository = new CommentRepository()) {
    this.repository = repository;
  }

  /**
   * Generate cache key for a single comment
   */
  private getCommentCacheKey(commentId: string): string {
    return `${this.COMMENT_CACHE_PREFIX}${commentId}`;
  }

  /**
   * Generate cache key for comments list by post
   */
  private getCommentsListCacheKey(postId: string, limit: number, offset: number): string {
    return `${this.COMMENTS_LIST_PREFIX}${postId}:${limit}:${offset}`;
  }

  /**
   * Generate cache key for replies list by comment
   */
  private getRepliesListCacheKey(commentId: string, limit: number, offset: number): string {
    return `${this.REPLIES_LIST_PREFIX}${commentId}:${limit}:${offset}`;
  }

  /**
   * Invalidate comment cache
   */
  private async invalidateCommentCache(commentId: string): Promise<void> {
    await cacheService.del(this.getCommentCacheKey(commentId));
  }

  /**
   * Invalidate all comments list cache for a post
   */
  private async invalidateCommentsListCache(postId: string): Promise<void> {
    await cacheService.delPattern(`${this.COMMENTS_LIST_PREFIX}${postId}:*`);
  }

  /**
   * Invalidate all replies list cache for a comment
   */
  private async invalidateRepliesListCache(commentId: string): Promise<void> {
    await cacheService.delPattern(`${this.REPLIES_LIST_PREFIX}${commentId}:*`);
  }

  /**
   * Create a new comment or reply
   * @param postId - Post ID
   * @param userId - Author user ID
   * @param data - Comment data
   * @returns Created comment with author information
   */
  async createComment(
    postId: string,
    userId: string,
    data: CreateCommentDto
  ): Promise<CreateCommentResponse> {
    // If this is a reply, validate that parent comment exists and belongs to same post
    if (data.parentCommentId) {
      const parentComment = await this.repository.findById(data.parentCommentId);

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.isDeleted) {
        throw new Error('Cannot reply to deleted comment');
      }

      if (parentComment.postId !== postId) {
        throw new Error('Parent comment does not belong to this post');
      }
    }

    // Create the comment
    const comment = await this.repository.create({
      content: data.content,
      postId,
      authorId: userId,
      parentCommentId: data.parentCommentId ?? null,
    });

    // Fetch full comment with author info
    const commentWithAuthor = await this.repository.findById(comment.id);

    if (!commentWithAuthor) {
      throw new Error('Failed to retrieve created comment');
    }

    const response = {
      comment: {
        id: commentWithAuthor.id,
        content: commentWithAuthor.content,
        author: commentWithAuthor.author,
        postId: commentWithAuthor.postId,
        parentCommentId: commentWithAuthor.parentCommentId,
        isDeleted: commentWithAuthor.isDeleted,
        isEdited: commentWithAuthor.isEdited,
        editedAt: commentWithAuthor.editedAt,
        editedByAdmin: false, // New comments are not edited
        createdAt: commentWithAuthor.createdAt,
        updatedAt: commentWithAuthor.updatedAt,
      },
    };

    // Cache the created comment
    await cacheService.set(this.getCommentCacheKey(comment.id), response.comment, this.CACHE_TTL);

    // Invalidate comments list cache for the post
    await this.invalidateCommentsListCache(postId);

    // If this is a reply, also invalidate the parent's replies cache
    if (data.parentCommentId) {
      await this.invalidateRepliesListCache(data.parentCommentId);
    }

    return response;
  }

  /**
   * Get a single comment by ID
   * @param commentId - Comment ID
   * @returns Comment with author information
   */
  async getCommentById(commentId: string): Promise<GetCommentResponse> {
    // Try to get from cache first (cache-aside pattern)
    const cacheKey = this.getCommentCacheKey(commentId);
    const cachedComment = await cacheService.get<CommentResponse>(cacheKey);

    if (cachedComment) {
      return { comment: cachedComment };
    }

    // Cache miss - fetch from database
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.isDeleted) {
      throw new Error('Comment has been deleted');
    }

    const commentResponse = {
      id: comment.id,
      content: comment.content,
      author: comment.author,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      isDeleted: comment.isDeleted,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      editedByAdmin: comment.isEdited && comment.editedBy !== null && comment.editedBy !== comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    // Store in cache for future requests
    await cacheService.set(cacheKey, commentResponse, this.CACHE_TTL);

    return { comment: commentResponse };
  }

  /**
   * Get top-level comments for a post (paginated)
   * @param postId - Post ID
   * @param limit - Maximum number of comments to return
   * @param offset - Number of comments to skip
   * @returns Comments with pagination info
   */
  async getCommentsByPostId(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<GetCommentsResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Try to get from cache first (cache-aside pattern)
    const cacheKey = this.getCommentsListCacheKey(postId, safeLimit, safeOffset);
    const cachedResponse = await cacheService.get<GetCommentsResponse>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Cache miss - fetch from database
    const commentsData = await this.repository.getByPostId(
      postId,
      safeLimit,
      safeOffset
    );

    // Get reply count for each comment (could be optimized with a single query)
    const comments: CommentResponse[] = await Promise.all(
      commentsData.map(async (comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author,
        postId: comment.postId,
        parentCommentId: comment.parentCommentId,
        isDeleted: comment.isDeleted,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt,
        editedByAdmin: comment.isEdited && comment.editedBy !== null && comment.editedBy !== comment.authorId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replyCount: await this.repository.countReplies(comment.id),
      }))
    );

    // Get total count for pagination
    const total = await this.repository.countByPostId(postId);

    const response = {
      comments,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };

    // Store in cache for future requests
    await cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Get replies for a comment (paginated)
   * @param commentId - Parent comment ID
   * @param limit - Maximum number of replies to return
   * @param offset - Number of replies to skip
   * @returns Replies with pagination info
   */
  async getReplies(
    commentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<GetRepliesResponse> {
    // Verify parent comment exists
    const parentComment = await this.repository.findById(commentId);

    if (!parentComment) {
      throw new Error('Comment not found');
    }

    if (parentComment.isDeleted) {
      throw new Error('Comment has been deleted');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Try to get from cache first (cache-aside pattern)
    const cacheKey = this.getRepliesListCacheKey(commentId, safeLimit, safeOffset);
    const cachedResponse = await cacheService.get<GetRepliesResponse>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Cache miss - fetch from database
    const repliesData = await this.repository.getReplies(
      commentId,
      safeLimit,
      safeOffset
    );

    const replies: CommentResponse[] = repliesData.map((reply) => ({
      id: reply.id,
      content: reply.content,
      author: reply.author,
      postId: reply.postId,
      parentCommentId: reply.parentCommentId,
      isDeleted: reply.isDeleted,
      isEdited: reply.isEdited,
      editedAt: reply.editedAt,
      editedByAdmin: reply.isEdited && reply.editedBy !== null && reply.editedBy !== reply.authorId,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    }));

    // Get total count for pagination
    const total = await this.repository.countReplies(commentId);

    const response = {
      replies,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };

    // Store in cache for future requests
    await cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Update a comment
   * Author can update their own comment, admin can update any comment
   * @param commentId - Comment ID
   * @param user - Authenticated user (from authentication middleware)
   * @param data - Update data
   * @returns Updated comment
   */
  async updateComment(
    commentId: string,
    user: AuthUser,
    data: UpdateCommentDto
  ): Promise<UpdateCommentResponse> {
    const existingComment = await this.repository.findById(commentId);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.isDeleted) {
      throw new Error('Cannot update deleted comment');
    }

    // Check permission: author or admin can edit
    if (!AuthorizationService.canEditResource(user, existingComment.author.id)) {
      throw new Error('You do not have permission to edit this comment');
    }

    // Update the comment
    await this.repository.update(commentId, data.content, user.userId);

    // Fetch updated comment with author info
    const updatedComment = await this.repository.findById(commentId);

    if (!updatedComment) {
      throw new Error('Failed to retrieve updated comment');
    }

    const editedByAdminValue =
      updatedComment.isEdited &&
      updatedComment.editedBy !== null &&
      updatedComment.editedBy !== updatedComment.authorId;

    const response = {
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        author: updatedComment.author,
        postId: updatedComment.postId,
        parentCommentId: updatedComment.parentCommentId,
        isDeleted: updatedComment.isDeleted,
        isEdited: updatedComment.isEdited,
        editedAt: updatedComment.editedAt,
        editedByAdmin: editedByAdminValue,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    };

    // Invalidate caches
    await Promise.all([
      this.invalidateCommentCache(commentId),
      this.invalidateCommentsListCache(existingComment.postId),
    ]);

    // If this is a reply, also invalidate the parent's replies cache
    if (existingComment.parentCommentId) {
      await this.invalidateRepliesListCache(existingComment.parentCommentId);
    }

    // Update cache with new data
    await cacheService.set(this.getCommentCacheKey(commentId), response.comment, this.CACHE_TTL);

    return response;
  }

  /**
   * Delete a comment (soft delete)
   * Author can delete their own comment, admin can delete any comment
   * @param commentId - Comment ID
   * @param user - Authenticated user (from authentication middleware)
   */
  async deleteComment(commentId: string, user: AuthUser): Promise<void> {
    const existingComment = await this.repository.findById(commentId);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.isDeleted) {
      throw new Error('Comment is already deleted');
    }

    // Check permission: author or admin can delete
    if (!AuthorizationService.canDeleteResource(user, existingComment.author.id)) {
      throw new Error('You do not have permission to delete this comment');
    }

    // Soft delete the comment
    await this.repository.softDelete(commentId, user.userId);

    // Invalidate caches
    await Promise.all([
      this.invalidateCommentCache(commentId),
      this.invalidateCommentsListCache(existingComment.postId),
    ]);

    // If this is a reply, also invalidate the parent's replies cache
    if (existingComment.parentCommentId) {
      await this.invalidateRepliesListCache(existingComment.parentCommentId);
    }
  }
}

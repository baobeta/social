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

/**
 * Service for comment business logic
 * Handles comment operations with validation and authorization
 */
export class CommentService {
  private repository: CommentRepository;

  constructor(repository: CommentRepository = new CommentRepository()) {
    this.repository = repository;
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

    return {
      comment: {
        id: commentWithAuthor.id,
        content: commentWithAuthor.content,
        author: commentWithAuthor.author,
        postId: commentWithAuthor.postId,
        parentCommentId: commentWithAuthor.parentCommentId,
        isDeleted: commentWithAuthor.isDeleted,
        isEdited: commentWithAuthor.isEdited,
        editedAt: commentWithAuthor.editedAt,
        createdAt: commentWithAuthor.createdAt,
        updatedAt: commentWithAuthor.updatedAt,
      },
    };
  }

  /**
   * Get a single comment by ID
   * @param commentId - Comment ID
   * @returns Comment with author information
   */
  async getCommentById(commentId: string): Promise<GetCommentResponse> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.isDeleted) {
      throw new Error('Comment has been deleted');
    }

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        author: comment.author,
        postId: comment.postId,
        parentCommentId: comment.parentCommentId,
        isDeleted: comment.isDeleted,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    };
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

    // Fetch comments with author info (single query with JOIN)
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
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replyCount: await this.repository.countReplies(comment.id),
      }))
    );

    // Get total count for pagination
    const total = await this.repository.countByPostId(postId);

    return {
      comments,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };
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

    // Fetch replies with author info (single query with JOIN)
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
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    }));

    // Get total count for pagination
    const total = await this.repository.countReplies(commentId);

    return {
      replies,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };
  }

  /**
   * Update a comment
   * Only the author can update their comment
   * @param commentId - Comment ID
   * @param userId - User ID (from authentication)
   * @param data - Update data
   * @returns Updated comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentDto
  ): Promise<UpdateCommentResponse> {
    const existingComment = await this.repository.findById(commentId);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.isDeleted) {
      throw new Error('Cannot update deleted comment');
    }

    // Check authorization
    const isAuthor = await this.repository.isAuthor(commentId, userId);
    if (!isAuthor) {
      throw new Error('You can only edit your own comments');
    }

    // Update the comment
    await this.repository.update(commentId, data.content, userId);

    // Fetch updated comment with author info
    const updatedComment = await this.repository.findById(commentId);

    if (!updatedComment) {
      throw new Error('Failed to retrieve updated comment');
    }

    return {
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        author: updatedComment.author,
        postId: updatedComment.postId,
        parentCommentId: updatedComment.parentCommentId,
        isDeleted: updatedComment.isDeleted,
        isEdited: updatedComment.isEdited,
        editedAt: updatedComment.editedAt,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    };
  }

  /**
   * Delete a comment (soft delete)
   * Only the author can delete their comment
   * @param commentId - Comment ID
   * @param userId - User ID (from authentication)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const existingComment = await this.repository.findById(commentId);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.isDeleted) {
      throw new Error('Comment is already deleted');
    }

    // Check authorization
    const isAuthor = await this.repository.isAuthor(commentId, userId);
    if (!isAuthor) {
      throw new Error('You can only delete your own comments');
    }

    // Soft delete the comment
    await this.repository.softDelete(commentId, userId);
  }
}

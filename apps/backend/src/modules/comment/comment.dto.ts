import { z } from 'zod';

/**
 * DTOs for comment operations
 * Validation schemas using Zod
 */

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Create comment request body
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content must be at most 2000 characters')
    .trim(),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;

/**
 * Update comment request body
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment content must be at most 2000 characters')
    .trim(),
});

export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;

/**
 * Comment ID parameter validation
 */
export const commentIdParamSchema = z.object({
  id: z.string().uuid('Invalid comment ID format'),
});

/**
 * Post ID parameter validation
 */
export const postIdParamSchema = z.object({
  postId: z.string().uuid('Invalid post ID format'),
});

/**
 * Pagination query parameters for comments
 */
export const commentQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(Math.max(parseInt(val, 10) || 20, 1), 100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => Math.max(parseInt(val, 10) || 0, 0)),
});

export type CommentQueryDto = z.infer<typeof commentQuerySchema>;

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Author information in comment response
 */
export interface CommentAuthor {
  id: string;
  username: string;
  fullName: string;
  displayName: string | null;
}

/**
 * Comment response
 */
export interface CommentResponse {
  id: string;
  content: string;
  author: CommentAuthor;
  postId: string;
  parentCommentId: string | null;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Reply count for nested comments
  replyCount?: number;
}

/**
 * Create comment response
 */
export interface CreateCommentResponse {
  comment: CommentResponse;
}

/**
 * Get comment response
 */
export interface GetCommentResponse {
  comment: CommentResponse;
}

/**
 * Update comment response
 */
export interface UpdateCommentResponse {
  comment: CommentResponse;
}

/**
 * Get comments for a post response
 */
export interface GetCommentsResponse {
  comments: CommentResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Get replies for a comment response
 */
export interface GetRepliesResponse {
  replies: CommentResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

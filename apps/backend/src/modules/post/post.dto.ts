import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new post
 */
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content must be at most 5000 characters')
    .trim(),
});

/**
 * Schema for updating a post
 */
export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content must be at most 5000 characters')
    .trim(),
});

/**
 * Schema for post ID parameter
 */
export const postIdParamSchema = z.object({
  id: z.string().uuid('Invalid post ID format'),
});

/**
 * Schema for timeline query parameters
 */
export const timelineQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: 'Offset must be 0 or greater',
    }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
export type PostIdParamDto = z.infer<typeof postIdParamSchema>;
export type TimelineQueryDto = z.infer<typeof timelineQuerySchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PostAuthor {
  id: string;
  username: string;
  fullName: string;
  displayName: string | null;
  // avatar: string | null; // TODO: Add when avatar feature is implemented
}

export interface PostResponse {
  id: string;
  content: string;
  author: PostAuthor;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // commentCount: number; // TODO: Add when comment feature is implemented
}

export interface CreatePostResponse {
  post: PostResponse;
}

export interface UpdatePostResponse {
  post: PostResponse;
}

export interface TimelineResponse {
  posts: PostResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PostDetailResponse {
  post: PostResponse;
  // comments: Comment[]; // TODO: Add when comment feature is implemented
}

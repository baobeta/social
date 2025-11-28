import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for search query parameters
 * Single search box that searches both posts and users
 */
export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query must be at most 200 characters')
    .trim(),
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
  type: z
    .enum(['all', 'users', 'posts'])
    .optional()
    .default('all'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SearchQueryDto = z.infer<typeof searchQuerySchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  displayName: string | null;
  role: 'user' | 'admin';
  relevance: number; // Search relevance score
}

export interface PostSearchResult {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    displayName: string | null;
  };
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  relevance: number; // Search relevance score
}

export interface SearchResponse {
  query: string;
  results: {
    users: UserSearchResult[];
    posts: PostSearchResult[];
  };
  counts: {
    users: number;
    posts: number;
    total: number;
  };
  pagination: {
    limit: number;
    offset: number;
  };
}

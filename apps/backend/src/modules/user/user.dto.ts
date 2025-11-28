import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for updating user profile
 * Users can update their full name and display name
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name cannot be empty')
    .max(100, 'Full name must be at most 100 characters')
    .optional(),
  displayName: z
    .string()
    .max(100, 'Display name must be at most 100 characters')
    .nullable()
    .optional(),
});

/**
 * Schema for getting user by ID (path parameter)
 */
export const getUserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type GetUserParamsDto = z.infer<typeof getUserParamsSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  displayName: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileResponse {
  user: UserResponse;
}

import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters'),
  displayName: z
    .string()
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    fullName: string;
    displayName: string | null;
    role: 'user' | 'admin';
  };
  token: string; // Access token (short-lived, 15 minutes)
  refreshToken: string; // Refresh token (long-lived, 7 days)
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
}

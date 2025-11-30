import { z } from 'zod';

/**
 * Query parameters for getting audit logs
 */
export const getAuditLogsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  resourceType: z.enum(['user', 'post', 'comment', 'auth']).optional(),
  resourceId: z.string().uuid().optional(),
  action: z.enum(['create', 'update', 'delete', 'read', 'login', 'logout', 'register', 'refresh_token']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
});

export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;

/**
 * Path parameter for audit log ID
 */
export const auditLogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type AuditLogIdParam = z.infer<typeof auditLogIdParamSchema>;

/**
 * Query parameters for audit statistics
 */
export const getAuditStatsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetAuditStatsQuery = z.infer<typeof getAuditStatsQuerySchema>;

/**
 * Data to create audit log entry
 */
export interface CreateAuditLogData {
  userId?: string;
  username?: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'register' | 'refresh_token';
  resourceType: 'user' | 'post' | 'comment' | 'auth';
  resourceId?: string;
  method?: string;
  path?: string;
  statusCode?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

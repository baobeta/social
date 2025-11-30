import type { Request, Response, NextFunction } from 'express';
import { AuditLogService } from './audit.service.js';
import type { CreateAuditLogData } from './audit.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Middleware to automatically log all controller actions
 * Captures request/response data and creates audit log entries
 */
export class AuditLogMiddleware {
  private service: AuditLogService;

  constructor(service: AuditLogService = new AuditLogService()) {
    this.service = service;
  }

  /**
   * Extract IP address from request
   */
  private getIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Determine action from HTTP method and path
   */
  private determineAction(
    method: string,
    path: string
  ): CreateAuditLogData['action'] | null {
    // Auth endpoints
    if (path.includes('/auth/login')) return 'login';
    if (path.includes('/auth/logout')) return 'logout';
    if (path.includes('/auth/register')) return 'register';
    if (path.includes('/auth/refresh')) return 'refresh_token';

    // Standard CRUD operations
    if (method === 'POST') return 'create';
    if (method === 'PATCH' || method === 'PUT') return 'update';
    if (method === 'DELETE') return 'delete';
    if (method === 'GET') return 'read';

    return null;
  }

  /**
   * Determine resource type from path
   */
  private determineResourceType(path: string): CreateAuditLogData['resourceType'] | null {
    if (path.includes('/posts')) return 'post';
    if (path.includes('/comments')) return 'comment';
    if (path.includes('/users')) return 'user';
    if (path.includes('/auth')) return 'auth';
    return null;
  }

  /**
   * Extract resource ID from path or request params
   */
  private extractResourceId(req: Request): string | undefined {
    // Check common parameter names
    return req.params.id || req.params.postId || req.params.commentId || undefined;
  }

  /**
   * Create audit log middleware
   * This middleware should be applied after authentication middleware
   */
  auditLog = () => {
    const self = this;
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res);
      const startTime = Date.now();

      res.json = function (data: any) {
        const responseTime = Date.now() - startTime;
        const action = self.determineAction(req.method, req.path);
        const resourceType = self.determineResourceType(req.path);

        if (action && resourceType) {
          self.createAuditLogAsync({
            userId: req.user?.userId,
            username: req.user?.username,
            action,
            resourceType,
            resourceId: self.extractResourceId(req),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode.toString(),
            ipAddress: self.getIpAddress(req),
            userAgent: req.headers['user-agent'],
            newValues: req.method !== 'GET' ? req.body : undefined,
            metadata: {
              responseTime,
              query: req.query,
            },
            errorMessage: !data?.success ? data?.error : undefined,
          }).catch((error) => {
            logger.error({ error, path: req.path }, 'Failed to create audit log');
          });
        }

        return originalJson(data);
      };

      next();
    };
  };

  /**
   * Create audit log asynchronously (non-blocking)
   */
  private async createAuditLogAsync(data: CreateAuditLogData): Promise<void> {
    try {
      await this.service.createAuditLog(data);
    } catch (error) {
      logger.error({ error, data }, 'Failed to create audit log entry');
    }
  }

  /**
   * Manual audit log creation for custom scenarios
   * Use this when you need to log specific events that don't fit the automatic middleware
   */
  static async logCustomEvent(
    data: CreateAuditLogData,
    service?: AuditLogService
  ): Promise<void> {
    const auditService = service || new AuditLogService();
    try {
      await auditService.createAuditLog(data);
    } catch (error) {
      logger.error({ error, data }, 'Failed to log custom audit event');
    }
  }
}

/**
 * Helper function to create audit log middleware instance
 */
export function createAuditLogMiddleware(): ReturnType<AuditLogMiddleware['auditLog']> {
  const middleware = new AuditLogMiddleware();
  return middleware.auditLog();
}

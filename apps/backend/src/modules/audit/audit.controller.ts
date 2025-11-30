import type { Request, Response } from 'express';
import { AuditLogService } from './audit.service.js';
import {
  getAuditLogsQuerySchema,
  auditLogIdParamSchema,
  getAuditStatsQuerySchema,
} from './audit.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller for audit log management
 * Handles HTTP requests and responses for audit log operations
 * Only admins can access audit logs
 */
export class AuditLogController {
  private service: AuditLogService;

  constructor(service: AuditLogService = new AuditLogService()) {
    this.service = service;
  }

  /**
   * Get audit logs with filtering and pagination
   * GET /api/audit-logs
   * @access Private (admin only)
   */
  getAuditLogs = async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      // Validate query parameters
      const validationResult = getAuditLogsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const result = await this.service.getAuditLogs(validationResult.data);

      logger.info(
        { logCount: result.logs.length, total: result.total, userId: req.user.userId },
        'Audit logs retrieved'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to get audit logs');

      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
      });
    }
  };

  /**
   * Get audit log by ID
   * GET /api/audit-logs/:id
   * @access Private (admin only)
   */
  getAuditLogById = async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      // Validate audit log ID
      const paramsValidation = auditLogIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid audit log ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;
      const auditLog = await this.service.getAuditLogById(id);

      res.status(200).json({
        success: true,
        data: { auditLog },
      });
    } catch (error) {
      logger.error({ error, auditLogId: req.params.id }, 'Failed to get audit log');

      if (error instanceof Error && error.message === 'Audit log not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get audit log',
      });
    }
  };

  /**
   * Get recent audit logs
   * GET /api/audit-logs/recent
   * @access Private (admin only)
   */
  getRecentAuditLogs = async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await this.service.getRecentAuditLogs(limit);

      logger.info({ logCount: logs.length, userId: req.user.userId }, 'Recent audit logs retrieved');

      res.status(200).json({
        success: true,
        data: { logs, count: logs.length },
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to get recent audit logs');

      res.status(500).json({
        success: false,
        error: 'Failed to get recent audit logs',
      });
    }
  };

  /**
   * Get audit log statistics
   * GET /api/audit-logs/statistics
   * @access Private (admin only)
   */
  getStatistics = async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      // Validate query parameters
      const validationResult = getAuditStatsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const statistics = await this.service.getStatistics(validationResult.data);

      logger.info({ userId: req.user.userId }, 'Audit statistics retrieved');

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to get audit statistics');

      res.status(500).json({
        success: false,
        error: 'Failed to get audit statistics',
      });
    }
  };

  /**
   * Get audit logs for current user
   * GET /api/audit-logs/me
   * @access Private (authenticated users can see their own logs)
   */
  getMyAuditLogs = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await this.service.getAuditLogsByUser(req.user.userId, limit, offset);

      logger.info(
        { logCount: result.logs.length, userId: req.user.userId },
        'User audit logs retrieved'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to get user audit logs');

      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
      });
    }
  };
}

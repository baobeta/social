import { AuditLogRepository } from './audit.repository.js';
import type { AuditLog } from '../../db/schema/index.js';
import type { CreateAuditLogData } from './audit.dto.js';

/**
 * Service for audit log business logic
 * Handles audit log operations and validation
 */
export class AuditLogService {
  private repository: AuditLogRepository;

  constructor(repository: AuditLogRepository = new AuditLogRepository()) {
    this.repository = repository;
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(data: CreateAuditLogData): Promise<AuditLog> {
    // Serialize complex objects to JSON strings
    const auditLogData = {
      userId: data.userId || null,
      username: data.username || null,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || null,
      method: data.method || null,
      path: data.path || null,
      statusCode: data.statusCode || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      errorMessage: data.errorMessage || null,
    };

    return this.repository.create(auditLogData);
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(options: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> {
    const { logs, total } = await this.repository.findMany({
      userId: options.userId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      action: options.action,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    return {
      logs: logs.map(this.formatAuditLog),
      total,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    const auditLog = await this.repository.findById(id);
    if (!auditLog) {
      throw new Error('Audit log not found');
    }
    return this.formatAuditLog(auditLog);
  }

  /**
   * Get audit logs for a specific resource
   */
  async getAuditLogsByResource(
    resourceType: string,
    resourceId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> {
    const { logs, total } = await this.repository.findByResource(
      resourceType,
      resourceId,
      limit,
      offset
    );

    return {
      logs: logs.map(this.formatAuditLog),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get audit logs for a specific user
   */
  async getAuditLogsByUser(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> {
    const { logs, total } = await this.repository.findByUser(userId, limit, offset);

    return {
      logs: logs.map(this.formatAuditLog),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
    const logs = await this.repository.findRecent(limit);
    return logs.map(this.formatAuditLog);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(options?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
  }> {
    return this.repository.getStatistics({
      userId: options?.userId,
      startDate: options?.startDate ? new Date(options.startDate) : undefined,
      endDate: options?.endDate ? new Date(options.endDate) : undefined,
    });
  }

  /**
   * Delete old audit logs (for cleanup/retention policies)
   * Only admins should be able to call this
   */
  async deleteOldAuditLogs(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.repository.deleteOlderThan(cutoffDate);
  }

  /**
   * Format audit log for API response
   * Parse JSON strings back to objects
   */
  private formatAuditLog(log: AuditLog): AuditLog {
    return {
      ...log,
      oldValues: log.oldValues ? log.oldValues : null,
      newValues: log.newValues ? log.newValues : null,
      metadata: log.metadata ? log.metadata : null,
    };
  }
}

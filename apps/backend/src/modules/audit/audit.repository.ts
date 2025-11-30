import { db } from '../../db/index.js';
import { auditLogs, type NewAuditLog, type AuditLog } from '../../db/schema/index.js';
import { desc, and, eq, gte, lte, sql } from 'drizzle-orm';

/**
 * Repository for audit log database operations
 * All database access for audit logs goes through this repository
 */
export class AuditLogRepository {
  /**
   * Create a new audit log entry
   */
  async create(data: NewAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(data).returning();
    return auditLog;
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async findMany(options: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const {
      userId,
      resourceType,
      resourceId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    // Build WHERE conditions
    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType as any));
    if (resourceId) conditions.push(eq(auditLogs.resourceId, resourceId));
    if (action) conditions.push(eq(auditLogs.action, action as any));
    if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(auditLogs.createdAt, endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get logs with pagination
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(auditLogs)
      .where(whereClause);

    return { logs, total: count };
  }

  /**
   * Get audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    const [auditLog] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
    return auditLog || null;
  }

  /**
   * Get audit logs for a specific resource
   */
  async findByResource(
    resourceType: string,
    resourceId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({
      resourceType,
      resourceId,
      limit,
      offset,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({
      userId,
      limit,
      offset,
    });
  }

  /**
   * Get recent audit logs
   */
  async findRecent(limit = 100): Promise<AuditLog[]> {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return logs;
  }

  /**
   * Delete old audit logs (for cleanup/retention policies)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await db.delete(auditLogs).where(lte(auditLogs.createdAt, date));
    return result.rowCount || 0;
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(options?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
  }> {
    const conditions = [];
    if (options?.userId) conditions.push(eq(auditLogs.userId, options.userId));
    if (options?.startDate) conditions.push(gte(auditLogs.createdAt, options.startDate));
    if (options?.endDate) conditions.push(lte(auditLogs.createdAt, options.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(auditLogs)
      .where(whereClause);

    // Get counts by action
    const actionCounts = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.action);

    // Get counts by resource type
    const resourceTypeCounts = await db
      .select({
        resourceType: auditLogs.resourceType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.resourceType);

    return {
      totalLogs: total,
      byAction: Object.fromEntries(actionCounts.map((row) => [row.action, row.count])),
      byResourceType: Object.fromEntries(
        resourceTypeCounts.map((row) => [row.resourceType, row.count])
      ),
    };
  }
}

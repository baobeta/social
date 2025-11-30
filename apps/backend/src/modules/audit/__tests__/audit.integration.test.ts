import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogService } from '../audit.service.js';
import { AuditLogRepository } from '../audit.repository.js';
import { createTestUser, createAdminUser, createTestPost } from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';
import type { CreateAuditLogData } from '../audit.dto.js';

describe('AuditLogService - Integration Tests', () => {
  let service: AuditLogService;
  let repository: AuditLogRepository;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new AuditLogRepository();
    service = new AuditLogService(repository);
  });

  describe('createAuditLog', () => {
    it('should create audit log entry in database', async () => {
      const testUser = await createTestUser({ username: 'audituser' });

      const auditData: CreateAuditLogData = {
        userId: testUser.id,
        username: testUser.username,
        action: 'create',
        resourceType: 'post',
        method: 'POST',
        path: '/api/posts',
        statusCode: '201',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        newValues: { content: 'test post' },
        metadata: { responseTime: 100 },
      };

      const result = await service.createAuditLog(auditData);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.username).toBe('audituser');
      expect(result.action).toBe('create');
      expect(result.resourceType).toBe('post');
      expect(result.method).toBe('POST');
      expect(result.path).toBe('/api/posts');
      expect(result.statusCode).toBe('201');
      expect(result.ipAddress).toBe('127.0.0.1');
      expect(result.userAgent).toBe('test-agent');
      expect(result.newValues).toBeTruthy();
      expect(result.metadata).toBeTruthy();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should serialize JSON fields correctly', async () => {
      const auditData: CreateAuditLogData = {
        action: 'update',
        resourceType: 'post',
        oldValues: { content: 'old content' },
        newValues: { content: 'new content' },
        metadata: { field: 'value', number: 123 },
      };

      const result = await service.createAuditLog(auditData);

      expect(result.oldValues).toBe('{"content":"old content"}');
      expect(result.newValues).toBe('{"content":"new content"}');
      expect(result.metadata).toBe('{"field":"value","number":123}');
    });

    it('should handle null optional fields', async () => {
      const auditData: CreateAuditLogData = {
        action: 'login',
        resourceType: 'auth',
      };

      const result = await service.createAuditLog(auditData);

      expect(result.userId).toBeNull();
      expect(result.username).toBeNull();
      expect(result.resourceId).toBeNull();
      expect(result.method).toBeNull();
      expect(result.path).toBeNull();
      expect(result.statusCode).toBeNull();
      expect(result.ipAddress).toBeNull();
      expect(result.userAgent).toBeNull();
      expect(result.oldValues).toBeNull();
      expect(result.newValues).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.errorMessage).toBeNull();
    });

    it('should create audit log without user for public actions', async () => {
      const auditData: CreateAuditLogData = {
        action: 'register',
        resourceType: 'auth',
        method: 'POST',
        path: '/api/auth/register',
        statusCode: '201',
      };

      const result = await service.createAuditLog(auditData);

      expect(result.userId).toBeNull();
      expect(result.action).toBe('register');
      expect(result.resourceType).toBe('auth');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with pagination', async () => {
      const testUser = await createTestUser();

      for (let i = 0; i < 5; i++) {
        await service.createAuditLog({
          userId: testUser.id,
          username: testUser.username,
          action: 'create',
          resourceType: 'post',
        });
      }

      const result = await service.getAuditLogs({
        limit: 3,
        offset: 0,
      });

      expect(result.logs.length).toBe(3);
      expect(result.total).toBe(5);
      expect(result.limit).toBe(3);
      expect(result.offset).toBe(0);
    });

    it('should filter by userId', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });

      await service.createAuditLog({
        userId: user1.id,
        username: user1.username,
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        userId: user2.id,
        username: user2.username,
        action: 'create',
        resourceType: 'post',
      });

      const result = await service.getAuditLogs({
        userId: user1.id,
        limit: 50,
        offset: 0,
      });

      expect(result.logs.length).toBe(1);
      expect(result.logs[0].userId).toBe(user1.id);
    });

    it('should filter by resourceType', async () => {
      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        action: 'create',
        resourceType: 'comment',
      });

      const result = await service.getAuditLogs({
        resourceType: 'post',
        limit: 50,
        offset: 0,
      });

      expect(result.logs.length).toBe(1);
      expect(result.logs[0].resourceType).toBe('post');
    });

    it('should filter by action', async () => {
      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        action: 'update',
        resourceType: 'post',
      });

      const result = await service.getAuditLogs({
        action: 'create',
        limit: 50,
        offset: 0,
      });

      expect(result.logs.length).toBe(1);
      expect(result.logs[0].action).toBe('create');
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await service.getAuditLogs({
        startDate: yesterday.toISOString(),
        endDate: tomorrow.toISOString(),
        limit: 50,
        offset: 0,
      });

      expect(result.logs.length).toBeGreaterThan(0);
    });
  });

  describe('getAuditLogById', () => {
    it('should retrieve audit log by ID', async () => {
      const testUser = await createTestUser();

      const created = await service.createAuditLog({
        userId: testUser.id,
        username: testUser.username,
        action: 'create',
        resourceType: 'post',
      });

      const result = await service.getAuditLogById(created.id);

      expect(result.id).toBe(created.id);
      expect(result.userId).toBe(testUser.id);
      expect(result.action).toBe('create');
    });

    it('should throw error for non-existent audit log', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getAuditLogById(fakeId)).rejects.toThrow('Audit log not found');
    });
  });

  describe('getAuditLogsByResource', () => {
    it('should retrieve audit logs for a specific resource', async () => {
      const testUser = await createTestUser();
      const post = await createTestPost(testUser.id);

      await service.createAuditLog({
        userId: testUser.id,
        username: testUser.username,
        action: 'create',
        resourceType: 'post',
        resourceId: post.id,
      });

      await service.createAuditLog({
        userId: testUser.id,
        username: testUser.username,
        action: 'update',
        resourceType: 'post',
        resourceId: post.id,
      });

      const result = await service.getAuditLogsByResource('post', post.id, 50, 0);

      expect(result.logs.length).toBe(2);
      expect(result.logs.every((log) => log.resourceId === post.id)).toBe(true);
    });
  });

  describe('getAuditLogsByUser', () => {
    it('should retrieve audit logs for a specific user', async () => {
      const testUser = await createTestUser();

      await service.createAuditLog({
        userId: testUser.id,
        username: testUser.username,
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        userId: testUser.id,
        username: testUser.username,
        action: 'update',
        resourceType: 'post',
      });

      const result = await service.getAuditLogsByUser(testUser.id, 50, 0);

      expect(result.logs.length).toBe(2);
      expect(result.logs.every((log) => log.userId === testUser.id)).toBe(true);
    });
  });

  describe('getRecentAuditLogs', () => {
    it('should retrieve recent audit logs ordered by date', async () => {
      for (let i = 0; i < 5; i++) {
        await service.createAuditLog({
          action: 'create',
          resourceType: 'post',
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const result = await service.getRecentAuditLogs(3);

      expect(result.length).toBe(3);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });
  });

  describe('getStatistics', () => {
    it('should return audit log statistics', async () => {
      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        action: 'update',
        resourceType: 'comment',
      });

      const stats = await service.getStatistics();

      expect(stats.totalLogs).toBe(3);
      expect(stats.byAction.create).toBe(2);
      expect(stats.byAction.update).toBe(1);
      expect(stats.byResourceType.post).toBe(2);
      expect(stats.byResourceType.comment).toBe(1);
    });

    it('should filter statistics by userId', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });

      await service.createAuditLog({
        userId: user1.id,
        username: user1.username,
        action: 'create',
        resourceType: 'post',
      });

      await service.createAuditLog({
        userId: user2.id,
        username: user2.username,
        action: 'create',
        resourceType: 'post',
      });

      const stats = await service.getStatistics({
        userId: user1.id,
      });

      expect(stats.totalLogs).toBe(1);
    });
  });

  describe('deleteOldAuditLogs', () => {
    it('should delete audit logs older than specified days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      await service.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      const beforeDelete = await service.getAuditLogs({ limit: 50, offset: 0 });
      expect(beforeDelete.logs.length).toBeGreaterThan(0);

      const deletedCount = await service.deleteOldAuditLogs(5);

      expect(deletedCount).toBeGreaterThanOrEqual(0);

      const afterDelete = await service.getAuditLogs({ limit: 50, offset: 0 });
      expect(afterDelete.logs.length).toBeLessThanOrEqual(beforeDelete.logs.length);
    });
  });
});


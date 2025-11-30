import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogService } from '../audit.service.js';
import { AuditLogRepository } from '../audit.repository.js';
import type { AuditLog } from '../../../db/schema/index.js';

// Mock the repository
vi.mock('../audit.repository.js');

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockRepository: any;

  const mockAuditLog: AuditLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    username: 'testuser',
    action: 'create',
    resourceType: 'post',
    resourceId: '123e4567-e89b-12d3-a456-426614174002',
    method: 'POST',
    path: '/api/posts',
    statusCode: '201',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    oldValues: null,
    newValues: '{"content":"test post"}',
    metadata: '{"responseTime":100}',
    errorMessage: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: vi.fn(),
      findMany: vi.fn(),
      findById: vi.fn(),
      findByResource: vi.fn(),
      findByUser: vi.fn(),
      findRecent: vi.fn(),
      deleteOlderThan: vi.fn(),
      getStatistics: vi.fn(),
    };

    // Create service with mock repository
    service = new AuditLogService(mockRepository);
  });

  describe('createAuditLog', () => {
    it('should create audit log with serialized JSON fields', async () => {
      mockRepository.create.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        username: 'testuser',
        action: 'create',
        resourceType: 'post',
        resourceId: '123e4567-e89b-12d3-a456-426614174002',
        method: 'POST',
        path: '/api/posts',
        statusCode: '201',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        newValues: { content: 'test post' },
        metadata: { responseTime: 100 },
      });

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        username: 'testuser',
        action: 'create',
        resourceType: 'post',
        resourceId: '123e4567-e89b-12d3-a456-426614174002',
        method: 'POST',
        path: '/api/posts',
        statusCode: '201',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        oldValues: null,
        newValues: '{"content":"test post"}',
        metadata: '{"responseTime":100}',
        errorMessage: null,
      });
    });

    it('should handle null optional fields', async () => {
      mockRepository.create.mockResolvedValue(mockAuditLog);

      await service.createAuditLog({
        action: 'login',
        resourceType: 'auth',
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: null,
        username: null,
        action: 'login',
        resourceType: 'auth',
        resourceId: null,
        method: null,
        path: null,
        statusCode: null,
        ipAddress: null,
        userAgent: null,
        oldValues: null,
        newValues: null,
        metadata: null,
        errorMessage: null,
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should get audit logs with pagination', async () => {
      mockRepository.findMany.mockResolvedValue({
        logs: [mockAuditLog],
        total: 1,
      });

      const result = await service.getAuditLogs({
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual({
        logs: [mockAuditLog],
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(mockRepository.findMany).toHaveBeenCalledWith({
        userId: undefined,
        resourceType: undefined,
        resourceId: undefined,
        action: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('should filter by userId', async () => {
      mockRepository.findMany.mockResolvedValue({
        logs: [mockAuditLog],
        total: 1,
      });

      await service.getAuditLogs({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        limit: 50,
        offset: 0,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123e4567-e89b-12d3-a456-426614174001',
        })
      );
    });

    it('should parse date strings', async () => {
      mockRepository.findMany.mockResolvedValue({
        logs: [mockAuditLog],
        total: 1,
      });

      await service.getAuditLogs({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        limit: 50,
        offset: 0,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-01-31T23:59:59Z'),
        })
      );
    });
  });

  describe('getAuditLogById', () => {
    it('should get audit log by ID', async () => {
      mockRepository.findById.mockResolvedValue(mockAuditLog);

      const result = await service.getAuditLogById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error if audit log not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getAuditLogById('123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Audit log not found');
    });
  });

  describe('getAuditLogsByResource', () => {
    it('should get audit logs by resource', async () => {
      mockRepository.findByResource.mockResolvedValue({
        logs: [mockAuditLog],
        total: 1,
      });

      const result = await service.getAuditLogsByResource(
        'post',
        '123e4567-e89b-12d3-a456-426614174002',
        50,
        0
      );

      expect(result).toEqual({
        logs: [mockAuditLog],
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(mockRepository.findByResource).toHaveBeenCalledWith(
        'post',
        '123e4567-e89b-12d3-a456-426614174002',
        50,
        0
      );
    });
  });

  describe('getAuditLogsByUser', () => {
    it('should get audit logs by user', async () => {
      mockRepository.findByUser.mockResolvedValue({
        logs: [mockAuditLog],
        total: 1,
      });

      const result = await service.getAuditLogsByUser(
        '123e4567-e89b-12d3-a456-426614174001',
        50,
        0
      );

      expect(result).toEqual({
        logs: [mockAuditLog],
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(mockRepository.findByUser).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        50,
        0
      );
    });
  });

  describe('getRecentAuditLogs', () => {
    it('should get recent audit logs', async () => {
      mockRepository.findRecent.mockResolvedValue([mockAuditLog]);

      const result = await service.getRecentAuditLogs(100);

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.findRecent).toHaveBeenCalledWith(100);
    });
  });

  describe('getStatistics', () => {
    it('should get audit log statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        byAction: { create: 50, update: 30, delete: 20 },
        byResourceType: { post: 60, comment: 40 },
      };

      mockRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      });

      expect(result).toEqual(mockStats);
      expect(mockRepository.getStatistics).toHaveBeenCalledWith({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      });
    });
  });

  describe('deleteOldAuditLogs', () => {
    it('should delete audit logs older than specified days', async () => {
      mockRepository.deleteOlderThan.mockResolvedValue(10);

      const result = await service.deleteOldAuditLogs(90);

      expect(result).toBe(10);
      expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));

      // Check that the date is approximately 90 days ago
      const callDate = mockRepository.deleteOlderThan.mock.calls[0][0];
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() - 90);

      // Allow 1 second difference for test execution time
      expect(Math.abs(callDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });
  });
});

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import auditRoutes from '../audit.routes.js';
import { createTestUser, createAdminUser } from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';
import { generateToken } from '../../../lib/jwt.js';
import { AuditLogService } from '../audit.service.js';

describe('Audit Log API Integration Tests', () => {
  let app: Express;
  let auditService: AuditLogService;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/audit-logs', auditRoutes);

    app.use((err: any, req: any, res: any, next: any) => {
      res.status(500).json({ success: false, error: err.message });
    });

    auditService = new AuditLogService();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  const getAuthCookie = (userId: string, username: string, role: string = 'user') => {
    const token = generateToken({ userId, username, role });
    return `access_token=${token}`;
  };

  describe('GET /api/audit-logs/me', () => {
    it('should return current user audit logs', async () => {
      const user = await createTestUser({ username: 'testuser' });

      await auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'create',
        resourceType: 'post',
      });

      const response = await request(app)
        .get('/api/audit-logs/me')
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      expect(response.body.data.logs[0].userId).toBe(user.id);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/audit-logs/me');

      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const user = await createTestUser({ username: 'testuser' });

      for (let i = 0; i < 5; i++) {
        await auditService.createAuditLog({
          userId: user.id,
          username: user.username,
          action: 'create',
          resourceType: 'post',
        });
      }

      const response = await request(app)
        .get('/api/audit-logs/me?limit=3&offset=0')
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(3);
      expect(response.body.data.total).toBe(5);
    });
  });

  describe('GET /api/audit-logs', () => {
    it('should return all audit logs for admin', async () => {
      const admin = await createAdminUser({ username: 'admin' });
      const user = await createTestUser({ username: 'testuser' });

      await auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'create',
        resourceType: 'post',
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(response.body.data.logs.length).toBeGreaterThan(0);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser({ username: 'testuser' });

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should filter by userId', async () => {
      const admin = await createAdminUser({ username: 'admin' });
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });

      await auditService.createAuditLog({
        userId: user1.id,
        username: user1.username,
        action: 'create',
        resourceType: 'post',
      });

      await auditService.createAuditLog({
        userId: user2.id,
        username: user2.username,
        action: 'create',
        resourceType: 'post',
      });

      const response = await request(app)
        .get(`/api/audit-logs?userId=${user1.id}`)
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].userId).toBe(user1.id);
    });

    it('should filter by resourceType', async () => {
      const admin = await createAdminUser({ username: 'admin' });

      await auditService.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await auditService.createAuditLog({
        action: 'create',
        resourceType: 'comment',
      });

      const response = await request(app)
        .get('/api/audit-logs?resourceType=post')
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].resourceType).toBe('post');
    });

    it('should filter by action', async () => {
      const admin = await createAdminUser({ username: 'admin' });

      await auditService.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await auditService.createAuditLog({
        action: 'update',
        resourceType: 'post',
      });

      const response = await request(app)
        .get('/api/audit-logs?action=create')
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].action).toBe('create');
    });
  });

  describe('GET /api/audit-logs/:id', () => {
    it('should return audit log by ID for admin', async () => {
      const admin = await createAdminUser({ username: 'admin' });
      const user = await createTestUser({ username: 'testuser' });

      const auditLog = await auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'create',
        resourceType: 'post',
      });

      const response = await request(app)
        .get(`/api/audit-logs/${auditLog.id}`)
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.auditLog.id).toBe(auditLog.id);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser({ username: 'testuser' });
      const auditLog = await auditService.createAuditLog({
        userId: user.id,
        username: user.username,
        action: 'create',
        resourceType: 'post',
      });

      const response = await request(app)
        .get(`/api/audit-logs/${auditLog.id}`)
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should return 404 for non-existent audit log', async () => {
      const admin = await createAdminUser({ username: 'admin' });
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/audit-logs/${fakeId}`)
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Audit log not found');
    });
  });

  describe('GET /api/audit-logs/recent', () => {
    it('should return recent audit logs for admin', async () => {
      const admin = await createAdminUser({ username: 'admin' });

      for (let i = 0; i < 5; i++) {
        await auditService.createAuditLog({
          action: 'create',
          resourceType: 'post',
        });
      }

      const response = await request(app)
        .get('/api/audit-logs/recent?limit=3')
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBe(3);
      expect(response.body.data.count).toBe(3);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser({ username: 'testuser' });

      const response = await request(app)
        .get('/api/audit-logs/recent')
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/audit-logs/statistics', () => {
    it('should return audit statistics for admin', async () => {
      const admin = await createAdminUser({ username: 'admin' });

      await auditService.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await auditService.createAuditLog({
        action: 'create',
        resourceType: 'post',
      });

      await auditService.createAuditLog({
        action: 'update',
        resourceType: 'comment',
      });

      const response = await request(app)
        .get('/api/audit-logs/statistics')
        .set('Cookie', getAuthCookie(admin.id, admin.username, 'admin'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLogs).toBeGreaterThan(0);
      expect(response.body.data.byAction).toBeDefined();
      expect(response.body.data.byResourceType).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser({ username: 'testuser' });

      const response = await request(app)
        .get('/api/audit-logs/statistics')
        .set('Cookie', getAuthCookie(user.id, user.username));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });
});


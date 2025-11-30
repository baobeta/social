import { Router } from 'express';
import { AuditLogController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createAuditLogMiddleware } from './audit.middleware.js';

const router = Router();
const controller = new AuditLogController();
const auditLogMiddleware = createAuditLogMiddleware();

/**
 * Audit log routes
 * All routes require authentication
 * Most routes require admin role
 */

// Get current user's audit logs (any authenticated user)
router.get('/me', authenticate, auditLogMiddleware, controller.getMyAuditLogs);

// Get recent audit logs (admin only)
router.get('/recent', authenticate, auditLogMiddleware, controller.getRecentAuditLogs);

// Get audit statistics (admin only)
router.get('/statistics', authenticate, auditLogMiddleware, controller.getStatistics);

// Get audit log by ID (admin only)
router.get('/:id', authenticate, auditLogMiddleware, controller.getAuditLogById);

// Get all audit logs with filtering (admin only)
router.get('/', authenticate, auditLogMiddleware, controller.getAuditLogs);

export default router;

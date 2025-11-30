import { Router } from 'express';
import { CommentController } from './comment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createAuditLogMiddleware } from '../audit/audit.middleware.js';

const router = Router();
const controller = new CommentController();
const auditLogMiddleware = createAuditLogMiddleware();

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Create a new comment on a post (or reply to a comment)
 * @access  Private (requires authentication)
 */
router.post('/posts/:postId/comments', authenticate, auditLogMiddleware, controller.createComment);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get top-level comments for a post (paginated)
 * @access  Private (requires authentication)
 */
router.get('/posts/:postId/comments', authenticate, auditLogMiddleware, controller.getCommentsByPost);

/**
 * @route   GET /api/comments/:id
 * @desc    Get a single comment by ID
 * @access  Private (requires authentication)
 */
router.get('/comments/:id', authenticate, auditLogMiddleware, controller.getCommentById);

/**
 * @route   GET /api/comments/:id/replies
 * @desc    Get replies for a comment (paginated)
 * @access  Private (requires authentication)
 */
router.get('/comments/:id/replies', authenticate, auditLogMiddleware, controller.getReplies);

/**
 * @route   PATCH /api/comments/:id
 * @desc    Update a comment (author only)
 * @access  Private (requires authentication)
 */
router.patch('/comments/:id', authenticate, auditLogMiddleware, controller.updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (soft delete, author only)
 * @access  Private (requires authentication)
 */
router.delete('/comments/:id', authenticate, auditLogMiddleware, controller.deleteComment);

export default router;

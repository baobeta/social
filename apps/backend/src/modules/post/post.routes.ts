import { Router } from 'express';
import { PostController } from './post.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createAuditLogMiddleware } from '../audit/audit.middleware.js';

const router = Router();
const controller = new PostController();
const auditLogMiddleware = createAuditLogMiddleware();

/**
 * @route   GET /api/posts
 * @desc    Get global timeline (all posts, sorted by date desc)
 * @access  Private (requires authentication)
 */
router.get('/', authenticate, auditLogMiddleware, controller.getTimeline);

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (requires authentication)
 */
router.post('/', authenticate, auditLogMiddleware, controller.createPost);

/**
 * @route   GET /api/posts/user/:id
 * @desc    Get posts by a specific user
 * @access  Private (requires authentication)
 */
router.get('/user/:id', authenticate, auditLogMiddleware, controller.getPostsByUser);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, auditLogMiddleware, controller.getPostById);

/**
 * @route   PATCH /api/posts/:id
 * @desc    Update a post (author only)
 * @access  Private (requires authentication)
 */
router.patch('/:id', authenticate, auditLogMiddleware, controller.updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (soft delete, author only)
 * @access  Private (requires authentication)
 */
router.delete('/:id', authenticate, auditLogMiddleware, controller.deletePost);

export default router;

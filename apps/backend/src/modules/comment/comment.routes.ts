import { Router } from 'express';
import { CommentController } from './comment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new CommentController();

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Create a new comment on a post (or reply to a comment)
 * @access  Private (requires authentication)
 */
router.post('/posts/:postId/comments', authenticate, controller.createComment);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get top-level comments for a post (paginated)
 * @access  Public
 */
router.get('/posts/:postId/comments', controller.getCommentsByPost);

/**
 * @route   GET /api/comments/:id
 * @desc    Get a single comment by ID
 * @access  Public
 */
router.get('/comments/:id', controller.getCommentById);

/**
 * @route   GET /api/comments/:id/replies
 * @desc    Get replies for a comment (paginated)
 * @access  Public
 */
router.get('/comments/:id/replies', controller.getReplies);

/**
 * @route   PATCH /api/comments/:id
 * @desc    Update a comment (author only)
 * @access  Private (requires authentication)
 */
router.patch('/comments/:id', authenticate, controller.updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (soft delete, author only)
 * @access  Private (requires authentication)
 */
router.delete('/comments/:id', authenticate, controller.deleteComment);

export default router;

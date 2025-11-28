import { Router } from 'express';
import { PostController } from './post.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new PostController();

/**
 * @route   GET /api/posts
 * @desc    Get global timeline (all posts, sorted by date desc)
 * @access  Public
 */
router.get('/', controller.getTimeline);

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (requires authentication)
 */
router.post('/', authenticate, controller.createPost);

/**
 * @route   GET /api/posts/user/:id
 * @desc    Get posts by a specific user
 * @access  Public
 */
router.get('/user/:id', controller.getPostsByUser);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get('/:id', controller.getPostById);

/**
 * @route   PATCH /api/posts/:id
 * @desc    Update a post (author only)
 * @access  Private (requires authentication)
 */
router.patch('/:id', authenticate, controller.updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (soft delete, author only)
 * @access  Private (requires authentication)
 */
router.delete('/:id', authenticate, controller.deletePost);

export default router;

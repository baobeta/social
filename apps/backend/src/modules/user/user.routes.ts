import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new UserController();

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
router.get('/me', authenticate, controller.getMyProfile);

/**
 * @route   PATCH /api/users/me
 * @desc    Update current user's profile (full name, display name)
 * @access  Private
 */
router.patch('/me', authenticate, controller.updateMyProfile);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:id', controller.getUserById);

export default router;

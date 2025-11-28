import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { authenticate } from '../../middleware/auth.middleware.ts';

const router = Router();
const controller = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', controller.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', controller.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, controller.me);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token cookie)
 */
router.post('/refresh', controller.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and revoke refresh token
 * @access  Private
 */
router.post('/logout', authenticate, controller.logout);

export default router;

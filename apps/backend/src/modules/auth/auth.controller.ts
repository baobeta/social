import type { Request, Response } from 'express';
import { AuthService } from './auth.service.ts';
import { registerSchema, loginSchema } from './auth.dto.ts';
import { logger } from '../../lib/logger.ts';

export class AuthController {
  private service: AuthService;

  constructor(service: AuthService = new AuthService()) {
    this.service = service;
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      // Register user
      const result = await this.service.register(data);

      logger.info({ username: data.username }, 'User registered successfully');

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error }, 'Registration failed');

      if (error instanceof Error && error.message === 'Username already exists') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  };

  /**
   * Login a user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      // Login user
      const result = await this.service.login(data);

      logger.info({ username: data.username }, 'User logged in successfully');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error }, 'Login failed');

      if (error instanceof Error && error.message === 'Invalid username or password') {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  };

  /**
   * Get current user (requires authentication)
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await this.service.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get current user');

      res.status(500).json({
        success: false,
        error: 'Failed to get user information',
      });
    }
  };

  /**
   * Logout (client-side only, just returns success)
   * POST /api/auth/logout
   */
  logout = async (_req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint exists for consistency and future server-side logout logic
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  };
}

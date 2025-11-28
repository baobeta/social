import type { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { updateProfileSchema, getUserParamsSchema } from './user.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller for user profile management
 * Handles HTTP requests and responses for user operations
 * Business logic is delegated to UserService
 */
export class UserController {
  private service: UserService;

  constructor(service: UserService = new UserService()) {
    this.service = service;
  }

  /**
   * Get current user's profile
   * GET /api/users/me
   * @access Private (requires authentication)
   */
  getMyProfile = async (req: Request, res: Response) => {
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
      logger.error({ error, userId: req.user?.userId }, 'Failed to get user profile');

      res.status(500).json({
        success: false,
        error: 'Failed to get user profile',
      });
    }
  };

  /**
   * Update current user's profile (name)
   * PATCH /api/users/me
   * @access Private (requires authentication)
   */
  updateMyProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate request body
      const validationResult = updateProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      // Update profile
      const result = await this.service.updateProfile(req.user.userId, data);

      logger.info(
        { userId: req.user.userId, updates: Object.keys(data) },
        'User profile updated'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to update profile');

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message === 'No fields to update') {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }
  };

  /**
   * Get user profile by ID
   * GET /api/users/:id
   * @access Public (anyone can view user profiles)
   */
  getUserById = async (req: Request, res: Response) => {
    try {
      // Validate path parameter
      const paramsValidation = getUserParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;

      const user = await this.service.getUserById(id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to get user by ID');

      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  };
}

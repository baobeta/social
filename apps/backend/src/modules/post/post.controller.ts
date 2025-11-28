import type { Request, Response } from 'express';
import { PostService } from './post.service.js';
import {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  timelineQuerySchema,
} from './post.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller for post management
 * Handles HTTP requests and responses for post operations
 */
export class PostController {
  private service: PostService;

  constructor(service: PostService = new PostService()) {
    this.service = service;
  }

  /**
   * Get global timeline (all posts)
   * GET /api/posts
   * @access Public
   */
  getTimeline = async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const validationResult = timelineQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const { limit, offset } = validationResult.data;

      const result = await this.service.getTimeline(limit, offset);

      logger.info(
        { postCount: result.posts.length, limit, offset },
        'Timeline retrieved'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get timeline');

      res.status(500).json({
        success: false,
        error: 'Failed to get timeline',
      });
    }
  };

  /**
   * Get a single post by ID
   * GET /api/posts/:id
   * @access Public
   */
  getPostById = async (req: Request, res: Response) => {
    try {
      // Validate post ID
      const paramsValidation = postIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid post ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;

      const result = await this.service.getPostById(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, postId: req.params.id }, 'Failed to get post');

      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message === 'Post has been deleted') {
          res.status(410).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get post',
      });
    }
  };

  /**
   * Create a new post
   * POST /api/posts
   * @access Private (requires authentication)
   */
  createPost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate request body
      const validationResult = createPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      const result = await this.service.createPost(req.user.userId, data);

      logger.info({ postId: result.post.id, userId: req.user.userId }, 'Post created');

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to create post');

      res.status(500).json({
        success: false,
        error: 'Failed to create post',
      });
    }
  };

  /**
   * Update a post
   * PATCH /api/posts/:id
   * @access Private (requires authentication, author only)
   */
  updatePost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate post ID
      const paramsValidation = postIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid post ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      // Validate request body
      const bodyValidation = updatePostSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;
      const data = bodyValidation.data;

      const result = await this.service.updatePost(id, req.user, data);

      logger.info({ postId: id, userId: req.user.userId }, 'Post updated');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, postId: req.params.id, userId: req.user?.userId }, 'Failed to update post');

      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (
          error.message === 'You do not have permission to edit this post' ||
          error.message === 'You can only edit your own posts' ||
          error.message === 'Cannot update deleted post'
        ) {
          res.status(403).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update post',
      });
    }
  };

  /**
   * Delete a post (soft delete)
   * DELETE /api/posts/:id
   * @access Private (requires authentication, author only)
   */
  deletePost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate post ID
      const paramsValidation = postIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid post ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;

      await this.service.deletePost(id, req.user);

      logger.info({ postId: id, userId: req.user.userId }, 'Post deleted');

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      logger.error({ error, postId: req.params.id, userId: req.user?.userId }, 'Failed to delete post');

      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (
          error.message === 'You do not have permission to delete this post' ||
          error.message === 'You can only delete your own posts' ||
          error.message === 'Post is already deleted'
        ) {
          res.status(403).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete post',
      });
    }
  };

  /**
   * Get posts by a specific user
   * GET /api/posts/user/:id
   * @access Public
   */
  getPostsByUser = async (req: Request, res: Response) => {
    try {
      // Validate user ID
      const paramsValidation = postIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      // Validate query parameters
      const queryValidation = timelineQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: queryValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;
      const { limit, offset } = queryValidation.data;

      const result = await this.service.getPostsByAuthor(id, limit, offset);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.params.id }, 'Failed to get user posts');

      res.status(500).json({
        success: false,
        error: 'Failed to get user posts',
      });
    }
  };
}

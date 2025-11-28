import type { Request, Response } from 'express';
import { CommentService } from './comment.service.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  postIdParamSchema,
  commentQuerySchema,
} from './comment.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller for comment management
 * Handles HTTP requests and responses for comment operations
 */
export class CommentController {
  private service: CommentService;

  constructor(service: CommentService = new CommentService()) {
    this.service = service;
  }

  /**
   * Create a new comment on a post
   * POST /api/posts/:postId/comments
   * @access Private (requires authentication)
   */
  createComment = async (req: Request, res: Response) => {
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
      const bodyValidation = createCommentSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyValidation.error.errors,
        });
        return;
      }

      const { postId } = paramsValidation.data;
      const data = bodyValidation.data;

      const result = await this.service.createComment(postId, req.user.userId, data);

      logger.info(
        {
          commentId: result.comment.id,
          postId,
          userId: req.user.userId,
          isReply: !!data.parentCommentId,
        },
        'Comment created'
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.userId }, 'Failed to create comment');

      if (error instanceof Error) {
        if (
          error.message === 'Parent comment not found' ||
          error.message === 'Cannot reply to deleted comment' ||
          error.message === 'Parent comment does not belong to this post'
        ) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create comment',
      });
    }
  };

  /**
   * Get comments for a post (top-level only, paginated)
   * GET /api/posts/:postId/comments?limit=20&offset=0
   * @access Public
   */
  getCommentsByPost = async (req: Request, res: Response) => {
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

      // Validate query parameters
      const queryValidation = commentQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: queryValidation.error.errors,
        });
        return;
      }

      const { postId } = paramsValidation.data;
      const { limit, offset } = queryValidation.data;

      const result = await this.service.getCommentsByPostId(postId, limit, offset);

      logger.info(
        { postId, commentCount: result.comments.length, limit, offset },
        'Comments retrieved'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, postId: req.params.postId }, 'Failed to get comments');

      res.status(500).json({
        success: false,
        error: 'Failed to get comments',
      });
    }
  };

  /**
   * Get replies for a comment (paginated)
   * GET /api/comments/:id/replies?limit=20&offset=0
   * @access Public
   */
  getReplies = async (req: Request, res: Response) => {
    try {
      // Validate comment ID
      const paramsValidation = commentIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      // Validate query parameters
      const queryValidation = commentQuerySchema.safeParse(req.query);
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

      const result = await this.service.getReplies(id, limit, offset);

      logger.info(
        { commentId: id, replyCount: result.replies.length, limit, offset },
        'Replies retrieved'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, commentId: req.params.id }, 'Failed to get replies');

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message === 'Comment has been deleted') {
          res.status(410).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get replies',
      });
    }
  };

  /**
   * Get a single comment by ID
   * GET /api/comments/:id
   * @access Public
   */
  getCommentById = async (req: Request, res: Response) => {
    try {
      // Validate comment ID
      const paramsValidation = commentIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;

      const result = await this.service.getCommentById(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error, commentId: req.params.id }, 'Failed to get comment');

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message === 'Comment has been deleted') {
          res.status(410).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get comment',
      });
    }
  };

  /**
   * Update a comment
   * PATCH /api/comments/:id
   * @access Private (requires authentication, author only)
   */
  updateComment = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate comment ID
      const paramsValidation = commentIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      // Validate request body
      const bodyValidation = updateCommentSchema.safeParse(req.body);
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

      const result = await this.service.updateComment(id, req.user.userId, data);

      logger.info({ commentId: id, userId: req.user.userId }, 'Comment updated');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(
        { error, commentId: req.params.id, userId: req.user?.userId },
        'Failed to update comment'
      );

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (
          error.message === 'You can only edit your own comments' ||
          error.message === 'Cannot update deleted comment'
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
        error: 'Failed to update comment',
      });
    }
  };

  /**
   * Delete a comment (soft delete)
   * DELETE /api/comments/:id
   * @access Private (requires authentication, author only)
   */
  deleteComment = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate comment ID
      const paramsValidation = commentIdParamSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment ID',
          details: paramsValidation.error.errors,
        });
        return;
      }

      const { id } = paramsValidation.data;

      await this.service.deleteComment(id, req.user.userId);

      logger.info({ commentId: id, userId: req.user.userId }, 'Comment deleted');

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      logger.error(
        { error, commentId: req.params.id, userId: req.user?.userId },
        'Failed to delete comment'
      );

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (
          error.message === 'You can only delete your own comments' ||
          error.message === 'Comment is already deleted'
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
        error: 'Failed to delete comment',
      });
    }
  };
}

import type { Request, Response } from 'express';
import { SearchService } from './search.service.js';
import { searchQuerySchema } from './search.dto.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller for search operations
 * Handles HTTP requests for searching users and posts
 */
export class SearchController {
  private service: SearchService;

  constructor(service: SearchService = new SearchService()) {
    this.service = service;
  }

  /**
   * Unified search endpoint
   * Searches both users and posts in a single request
   * GET /api/search?q=query&limit=20&offset=0&type=all
   * @access Public
   */
  search = async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const validationResult = searchQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const params = validationResult.data;

      // Perform search
      const results = await this.service.search(params);

      logger.info(
        {
          query: params.q,
          type: params.type,
          userCount: results.counts.users,
          postCount: results.counts.posts,
        },
        'Search performed'
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error({ error, query: req.query.q }, 'Search failed');

      if (error instanceof Error && error.message === 'Search query cannot be empty') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  };

  /**
   * Search users only
   * GET /api/search/users?q=query&limit=20&offset=0
   * @access Public
   */
  searchUsers = async (req: Request, res: Response) => {
    try {
      const { q, limit = '20', offset = '0' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const parsedLimit = Math.min(parseInt(limit as string, 10) || 20, 100);
      const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

      const results = await this.service.searchUsers(q, parsedLimit, parsedOffset);

      logger.info({ query: q, count: results.length }, 'User search performed');

      res.status(200).json({
        success: true,
        data: {
          query: q,
          users: results,
          count: results.length,
          pagination: {
            limit: parsedLimit,
            offset: parsedOffset,
          },
        },
      });
    } catch (error) {
      logger.error({ error, query: req.query.q }, 'User search failed');

      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  };

  /**
   * Search posts only
   * GET /api/search/posts?q=query&limit=20&offset=0
   * @access Public
   */
  searchPosts = async (req: Request, res: Response) => {
    try {
      const { q, limit = '20', offset = '0' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const parsedLimit = Math.min(parseInt(limit as string, 10) || 20, 100);
      const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

      const results = await this.service.searchPosts(q, parsedLimit, parsedOffset);

      logger.info({ query: q, count: results.length }, 'Post search performed');

      res.status(200).json({
        success: true,
        data: {
          query: q,
          posts: results,
          count: results.length,
          pagination: {
            limit: parsedLimit,
            offset: parsedOffset,
          },
        },
      });
    } catch (error) {
      logger.error({ error, query: req.query.q }, 'Post search failed');

      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  };
}

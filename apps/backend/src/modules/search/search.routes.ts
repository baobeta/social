import { Router } from 'express';
import { SearchController } from './search.controller.js';

const router = Router();
const controller = new SearchController();

/**
 * @route   GET /api/search
 * @desc    Unified search for users and posts
 * @query   q - Search query (required)
 * @query   limit - Results per page (default: 20, max: 100)
 * @query   offset - Number of results to skip (default: 0)
 * @query   type - Search type: 'all', 'users', or 'posts' (default: 'all')
 * @access  Public
 */
router.get('/', controller.search);

/**
 * @route   GET /api/search/users
 * @desc    Search users only
 * @query   q - Search query (required)
 * @query   limit - Results per page (default: 20, max: 100)
 * @query   offset - Number of results to skip (default: 0)
 * @access  Public
 */
router.get('/users', controller.searchUsers);

/**
 * @route   GET /api/search/posts
 * @desc    Search posts only
 * @query   q - Search query (required)
 * @query   limit - Results per page (default: 20, max: 100)
 * @query   offset - Number of results to skip (default: 0)
 * @access  Public
 */
router.get('/posts', controller.searchPosts);

export default router;

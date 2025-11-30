import { SearchRepository } from './search.repository.js';
import { CommentRepository } from '../comment/comment.repository.js';
import type {
  SearchQueryDto,
  SearchResponse,
  UserSearchResult,
  PostSearchResult,
} from './search.dto.js';

/**
 * Service for search operations
 * Handles business logic for searching users and posts
 */
export class SearchService {
  private repository: SearchRepository;
  private commentRepository: CommentRepository;

  constructor(
    repository: SearchRepository = new SearchRepository(),
    commentRepository: CommentRepository = new CommentRepository()
  ) {
    this.repository = repository;
    this.commentRepository = commentRepository;
  }

  /**
   * Perform unified search across users and posts
   * @param params - Search parameters (query, limit, offset, type)
   * @returns Search results with users and posts
   */
  async search(params: SearchQueryDto): Promise<SearchResponse> {
    const { q, limit = 20, offset = 0, type = 'all' } = params;

    // Validate search query
    if (!q || q.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Determine what to search based on type parameter
    const searchUsers = type === 'all' || type === 'users';
    const searchPosts = type === 'all' || type === 'posts';

    // For 'all' type, split the limit between users and posts
    const userLimit = type === 'all' ? Math.ceil(limit / 2) : limit;
    const postLimit = type === 'all' ? Math.ceil(limit / 2) : limit;

    // Execute searches in parallel
    const [usersResult, postsResult, userCount, postCount] = await Promise.all([
      searchUsers
        ? this.repository.searchUsers(q, userLimit, offset)
        : Promise.resolve([]),
      searchPosts
        ? this.repository.searchPosts(q, postLimit, offset)
        : Promise.resolve([]),
      searchUsers ? this.repository.countUsers(q) : Promise.resolve(0),
      searchPosts ? this.repository.countPosts(q) : Promise.resolve(0),
    ]);

    // Transform users to search result format (exclude password)
    const users: UserSearchResult[] = usersResult.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      role: user.role,
      relevance: user.relevance,
    }));

    // Get comment counts for all posts (prevents N+1 query problem)
    const postIds = postsResult.map((post) => post.id);
    const commentCounts = await this.commentRepository.countByPostIds(postIds);

    // Transform posts to search result format
    const posts: PostSearchResult[] = postsResult.map((post) => ({
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        displayName: post.author.displayName,
      },
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      commentsCount: commentCounts.get(post.id) ?? 0,
      relevance: post.relevance,
    }));

    return {
      query: q,
      results: {
        users,
        posts,
      },
      counts: {
        users: userCount,
        posts: postCount,
        total: userCount + postCount,
      },
      pagination: {
        limit,
        offset,
      },
    };
  }

  /**
   * Search only users
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of user search results
   */
  async searchUsers(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const users = await this.repository.searchUsers(query, limit, offset);

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      role: user.role,
      relevance: user.relevance,
    }));
  }

  /**
   * Search only posts
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Object with posts array and total count
   */
  async searchPosts(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ posts: PostSearchResult[]; total: number }> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const [posts, total] = await Promise.all([
      this.repository.searchPosts(query, limit, offset),
      this.repository.countPosts(query),
    ]);

    // Get comment counts for all posts (prevents N+1 query problem)
    const postIds = posts.map((post) => post.id);
    const commentCounts = await this.commentRepository.countByPostIds(postIds);

    const transformedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        displayName: post.author.displayName,
      },
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      commentsCount: commentCounts.get(post.id) ?? 0,
      relevance: post.relevance,
    }));

    return {
      posts: transformedPosts,
      total,
    };
  }
}

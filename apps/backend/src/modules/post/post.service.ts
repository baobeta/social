import { PostRepository } from './post.repository.js';
import { CommentRepository } from '../comment/comment.repository.js';
import type {
  CreatePostDto,
  UpdatePostDto,
  PostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  TimelineResponse,
  PostDetailResponse,
} from './post.dto.js';
import { AuthorizationService, type AuthUser } from '../../lib/authorization.js';
import { cacheService } from '../../lib/cache.js';

/**
 * Service for post management
 * Contains business logic for post operations
 */
export class PostService {
  private repository: PostRepository;
  private commentRepository: CommentRepository;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly POST_CACHE_PREFIX = 'post:';
  private readonly TIMELINE_CACHE_PREFIX = 'timeline:';

  constructor(
    repository: PostRepository = new PostRepository(),
    commentRepository: CommentRepository = new CommentRepository()
  ) {
    this.repository = repository;
    this.commentRepository = commentRepository;
  }

  /**
   * Generate cache key for a single post
   */
  private getPostCacheKey(postId: string): string {
    return `${this.POST_CACHE_PREFIX}${postId}`;
  }

  /**
   * Generate cache key for timeline
   */
  private getTimelineCacheKey(limit: number, offset: number): string {
    return `${this.TIMELINE_CACHE_PREFIX}${limit}:${offset}`;
  }

  /**
   * Invalidate all timeline cache entries
   */
  private async invalidateTimelineCache(): Promise<void> {
    await cacheService.delPattern(`${this.TIMELINE_CACHE_PREFIX}*`);
  }

  /**
   * Invalidate post cache
   */
  private async invalidatePostCache(postId: string): Promise<void> {
    await cacheService.del(this.getPostCacheKey(postId));
  }

  /**
   * Create a new post
   * @param userId - Author user ID (from authentication)
   * @param data - Post data (content)
   * @returns Created post with author information
   */
  async createPost(userId: string, data: CreatePostDto): Promise<CreatePostResponse> {
    // Create the post
    const post = await this.repository.create({
      content: data.content,
      authorId: userId,
    });

    // Fetch the post with author information
    const postWithAuthor = await this.repository.findById(post.id);

    if (!postWithAuthor) {
      throw new Error('Failed to retrieve created post');
    }

    const response = {
      post: {
        id: postWithAuthor.id,
        content: postWithAuthor.content,
        author: postWithAuthor.author,
        isDeleted: postWithAuthor.isDeleted,
        isEdited: postWithAuthor.isEdited,
        editedAt: postWithAuthor.editedAt,
        editedByAdmin: false, // New posts are not edited
        createdAt: postWithAuthor.createdAt,
        updatedAt: postWithAuthor.updatedAt,
        commentsCount: 0, // New posts have 0 comments
      },
    };

    // Cache the created post
    await cacheService.set(this.getPostCacheKey(post.id), response.post, this.CACHE_TTL);

    // Invalidate timeline cache since a new post was created
    await this.invalidateTimelineCache();

    return response;
  }

  /**
   * Get global timeline (all posts from all users)
   * Sorted by date descending (newest first)
   * Excludes soft-deleted posts by default
   * @param limit - Maximum number of posts (default: 20, max: 100)
   * @param offset - Number of posts to skip (default: 0)
   * @param includeDeleted - Whether to include deleted posts (default: false)
   * @returns Timeline with posts and pagination info
   */
  async getTimeline(limit: number = 20, offset: number = 0, includeDeleted: boolean = false): Promise<TimelineResponse> {
    // Validate and cap limits
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Try to get from cache first (cache-aside pattern)
    // Note: We include includeDeleted in cache key to separate cached results
    const cacheKey = `${this.getTimelineCacheKey(safeLimit, safeOffset)}:${includeDeleted}`;
    const cachedTimeline = await cacheService.get<TimelineResponse>(cacheKey);

    if (cachedTimeline) {
      return cachedTimeline;
    }

    // Cache miss - fetch from database
    const [postsData, total] = await Promise.all([
      this.repository.getTimeline(safeLimit, safeOffset, includeDeleted),
      this.repository.countTimeline(),
    ]);

    // Get comment counts for all posts in a single query (prevents N+1)
    const postIds = postsData.map(post => post.id);
    const commentCounts = await this.commentRepository.countByPostIds(postIds);

    // Map posts with their comment counts
    const posts: PostResponse[] = postsData.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author,
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      editedByAdmin: post.isEdited && post.editedBy !== null && post.editedBy !== post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentsCount: commentCounts.get(post.id) ?? 0,
    }));

    const response = {
      posts,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };

    // Store in cache for future requests
    await cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Get a single post by ID
   * @param postId - Post ID
   * @returns Post with author information
   * @throws Error if post not found or deleted
   */
  async getPostById(postId: string): Promise<PostDetailResponse> {
    // Try to get from cache first (cache-aside pattern)
    const cacheKey = this.getPostCacheKey(postId);
    const cachedPost = await cacheService.get<PostResponse>(cacheKey);

    if (cachedPost) {
      return { post: cachedPost };
    }

    // Cache miss - fetch from database
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.isDeleted) {
      throw new Error('Post has been deleted');
    }

    const commentsCount = await this.commentRepository.countByPostId(postId);

    const postResponse = {
      id: post.id,
      content: post.content,
      author: post.author,
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      editedByAdmin: post.isEdited && post.editedBy !== null && post.editedBy !== post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentsCount,
    };

    // Store in cache for future requests
    await cacheService.set(cacheKey, postResponse, this.CACHE_TTL);

    return { post: postResponse };
  }

  /**
   * Update a post
   * Author can update their own post, admin can update any post
   * @param postId - Post ID
   * @param user - Authenticated user (from authentication middleware)
   * @param data - Update data (content)
   * @returns Updated post
   * @throws Error if post not found, deleted, or user lacks permission
   */
  async updatePost(
    postId: string,
    user: AuthUser,
    data: UpdatePostDto
  ): Promise<UpdatePostResponse> {
    // Check if post exists
    const existingPost = await this.repository.findById(postId);

    if (!existingPost) {
      throw new Error('Post not found');
    }

    if (existingPost.isDeleted) {
      throw new Error('Cannot update deleted post');
    }

    // Check permission: author or admin can edit
    if (!AuthorizationService.canEditResource(user, existingPost.author.id)) {
      throw new Error('You do not have permission to edit this post');
    }

    // Update the post
    await this.repository.update(postId, data.content, user.userId);

    // Fetch updated post with author information
    const updatedPost = await this.repository.findById(postId);

    if (!updatedPost) {
      throw new Error('Failed to retrieve updated post');
    }

    const commentsCount = await this.commentRepository.countByPostId(postId);

    const response = {
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
        author: updatedPost.author,
        isDeleted: updatedPost.isDeleted,
        isEdited: updatedPost.isEdited,
        editedAt: updatedPost.editedAt,
        editedByAdmin: updatedPost.isEdited && updatedPost.editedBy !== null && updatedPost.editedBy !== updatedPost.authorId,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
        commentsCount,
      },
    };

    // Invalidate caches
    await Promise.all([
      this.invalidatePostCache(postId),
      this.invalidateTimelineCache(),
    ]);

    // Update cache with new data
    await cacheService.set(this.getPostCacheKey(postId), response.post, this.CACHE_TTL);

    return response;
  }

  /**
   * Soft delete a post
   * Author can delete their own post, admin can delete any post
   * @param postId - Post ID
   * @param user - Authenticated user (from authentication middleware)
   * @throws Error if post not found, already deleted, or user lacks permission
   */
  async deletePost(postId: string, user: AuthUser): Promise<void> {
    // Check if post exists
    const existingPost = await this.repository.findById(postId);

    if (!existingPost) {
      throw new Error('Post not found');
    }

    if (existingPost.isDeleted) {
      throw new Error('Post is already deleted');
    }

    // Check permission: author or admin can delete
    if (!AuthorizationService.canDeleteResource(user, existingPost.author.id)) {
      throw new Error('You do not have permission to delete this post');
    }

    // Soft delete the post
    await this.repository.softDelete(postId, user.userId);

    // Invalidate caches
    await Promise.all([
      this.invalidatePostCache(postId),
      this.invalidateTimelineCache(),
    ]);
  }

  /**
   * Get posts by a specific user
   * @param authorId - Author user ID
   * @param limit - Maximum number of posts
   * @param offset - Number of posts to skip
   * @returns Posts by the author
   */
  async getPostsByAuthor(
    authorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<TimelineResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const postsData = await this.repository.getByAuthor(authorId, safeLimit, safeOffset);

    // Get comment counts for all posts in a single query (prevents N+1)
    const postIds = postsData.map(post => post.id);
    const commentCounts = await this.commentRepository.countByPostIds(postIds);

    // Map posts with their comment counts
    const posts: PostResponse[] = postsData.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author,
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      editedByAdmin: post.isEdited && post.editedBy !== null && post.editedBy !== post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentsCount: commentCounts.get(post.id) ?? 0,
    }));

    return {
      posts,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total: posts.length, // TODO: Add count query for accuracy
      },
    };
  }
}

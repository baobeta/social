import { PostRepository } from './post.repository.js';
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

/**
 * Service for post management
 * Contains business logic for post operations
 */
export class PostService {
  private repository: PostRepository;

  constructor(repository: PostRepository = new PostRepository()) {
    this.repository = repository;
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

    return {
      post: {
        id: postWithAuthor.id,
        content: postWithAuthor.content,
        author: postWithAuthor.author,
        isDeleted: postWithAuthor.isDeleted,
        isEdited: postWithAuthor.isEdited,
        editedAt: postWithAuthor.editedAt,
        createdAt: postWithAuthor.createdAt,
        updatedAt: postWithAuthor.updatedAt,
      },
    };
  }

  /**
   * Get global timeline (all posts from all users)
   * Sorted by date descending (newest first)
   * Excludes soft-deleted posts
   * @param limit - Maximum number of posts (default: 20, max: 100)
   * @param offset - Number of posts to skip (default: 0)
   * @returns Timeline with posts and pagination info
   */
  async getTimeline(limit: number = 20, offset: number = 0): Promise<TimelineResponse> {
    // Validate and cap limits
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Fetch posts and total count in parallel
    const [postsData, total] = await Promise.all([
      this.repository.getTimeline(safeLimit, safeOffset),
      this.repository.countTimeline(),
    ]);

    const posts: PostResponse[] = postsData.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author,
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return {
      posts,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
      },
    };
  }

  /**
   * Get a single post by ID
   * @param postId - Post ID
   * @returns Post with author information
   * @throws Error if post not found or deleted
   */
  async getPostById(postId: string): Promise<PostDetailResponse> {
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.isDeleted) {
      throw new Error('Post has been deleted');
    }

    return {
      post: {
        id: post.id,
        content: post.content,
        author: post.author,
        isDeleted: post.isDeleted,
        isEdited: post.isEdited,
        editedAt: post.editedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    };
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

    return {
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
        author: updatedPost.author,
        isDeleted: updatedPost.isDeleted,
        isEdited: updatedPost.isEdited,
        editedAt: updatedPost.editedAt,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
      },
    };
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

    const posts: PostResponse[] = postsData.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author,
      isDeleted: post.isDeleted,
      isEdited: post.isEdited,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
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

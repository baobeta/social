import { describe, it, expect, beforeEach } from 'vitest';
import { PostService } from '../post.service.js';
import { PostRepository } from '../post.repository.js';
import { createTestUser, createTestPost } from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';
import { countQueries } from '../../../test/query-counter.js';

/**
 * Integration tests for PostService
 * Tests with real database operations
 */
describe('PostService - Integration Tests', () => {
  let service: PostService;
  let repository: PostRepository;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new PostRepository();
    service = new PostService(repository);
  });

  describe('Create Post', () => {
    it('should create a post successfully', async () => {
      const user = await createTestUser({
        username: 'postauthor',
        fullName: 'Post Author',
      });

      const result = await service.createPost(user.id, {
        content: 'This is my first post!',
      });

      expect(result.post.id).toBeDefined();
      expect(result.post.content).toBe('This is my first post!');
      expect(result.post.author.username).toBe('postauthor');
      expect(result.post.isDeleted).toBe(false);
      expect(result.post.isEdited).toBe(false);
    });

    it('should include author information in created post', async () => {
      const user = await createTestUser({
        username: 'john',
        fullName: 'John Doe',
        displayName: 'Johnny',
      });

      const result = await service.createPost(user.id, {
        content: 'Test post',
      });

      expect(result.post.author).toEqual({
        id: user.id,
        username: 'john',
        fullName: 'John Doe',
        displayName: 'Johnny',
      });
    });
  });

  describe('Get Timeline', () => {
    it('should return posts sorted by date descending (newest first)', async () => {
      const user = await createTestUser();

      // Create posts with slight delay to ensure different timestamps
      const post1 = await createTestPost(user.id, { content: 'First post' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const post2 = await createTestPost(user.id, { content: 'Second post' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const post3 = await createTestPost(user.id, { content: 'Third post' });

      const result = await service.getTimeline(10, 0);

      expect(result.posts).toHaveLength(3);
      // Newest first
      expect(result.posts[0]?.content).toBe('Third post');
      expect(result.posts[1]?.content).toBe('Second post');
      expect(result.posts[2]?.content).toBe('First post');
    });

    it('should exclude soft-deleted posts from timeline', async () => {
      const user = await createTestUser();

      await createTestPost(user.id, { content: 'Active post' });
      await createTestPost(user.id, {
        content: 'Deleted post',
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.getTimeline(10, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].content).toBe('Active post');
    });

    it('should show posts from all users (global timeline)', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });
      const user3 = await createTestUser({ username: 'user3' });

      await createTestPost(user1.id, { content: 'Post by user1' });
      await createTestPost(user2.id, { content: 'Post by user2' });
      await createTestPost(user3.id, { content: 'Post by user3' });

      const result = await service.getTimeline(10, 0);

      expect(result.posts).toHaveLength(3);
      const usernames = result.posts.map((p) => p.author.username);
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
      expect(usernames).toContain('user3');
    });

    it('should support pagination with limit and offset', async () => {
      const user = await createTestUser();

      // Create 5 posts
      for (let i = 1; i <= 5; i++) {
        await createTestPost(user.id, { content: `Post ${i}` });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Get first 2 posts
      const page1 = await service.getTimeline(2, 0);
      expect(page1.posts).toHaveLength(2);
      expect(page1.pagination.limit).toBe(2);
      expect(page1.pagination.offset).toBe(0);

      // Get next 2 posts
      const page2 = await service.getTimeline(2, 2);
      expect(page2.posts).toHaveLength(2);
      expect(page2.pagination.offset).toBe(2);

      // Posts should be different
      expect(page1.posts[0]?.id).not.toBe(page2.posts[0]?.id);
    });

    it('should return total count in pagination', async () => {
      const user = await createTestUser();

      await createTestPost(user.id, { content: 'Post 1' });
      await createTestPost(user.id, { content: 'Post 2' });
      await createTestPost(user.id, { content: 'Post 3' });

      const result = await service.getTimeline(2, 0);

      expect(result.pagination.total).toBe(3);
      expect(result.posts).toHaveLength(2); // Only 2 returned due to limit
    });
  });

  describe('Get Post by ID', () => {
    it('should retrieve a post by ID', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Test post content',
      });

      const result = await service.getPostById(post.id);

      expect(result.post.id).toBe(post.id);
      expect(result.post.content).toBe('Test post content');
      expect(result.post.author).toBeDefined();
    });

    it('should throw error for non-existent post', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getPostById(fakeId)).rejects.toThrow('Post not found');
    });

    it('should throw error for deleted post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Deleted post',
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(service.getPostById(post.id)).rejects.toThrow('Post has been deleted');
    });
  });

  describe('Update Post', () => {
    it('should update post content', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Original content',
      });

      const result = await service.updatePost(post.id, user.id, {
        content: 'Updated content',
      });

      expect(result.post.content).toBe('Updated content');
      expect(result.post.isEdited).toBe(true);
      expect(result.post.editedAt).toBeDefined();
    });

    it('should only allow author to update their post', async () => {
      const author = await createTestUser({ username: 'author' });
      const otherUser = await createTestUser({ username: 'other' });

      const post = await createTestPost(author.id, {
        content: 'Original post',
      });

      await expect(
        service.updatePost(post.id, otherUser.id, {
          content: 'Hacked content',
        })
      ).rejects.toThrow('You can only edit your own posts');
    });

    it('should not allow updating deleted post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Post content',
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(
        service.updatePost(post.id, user.id, {
          content: 'New content',
        })
      ).rejects.toThrow('Cannot update deleted post');
    });
  });

  describe('Delete Post', () => {
    it('should soft delete a post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Post to delete',
      });

      await service.deletePost(post.id, user.id);

      // Post should not appear in timeline
      const timeline = await service.getTimeline(10, 0);
      expect(timeline.posts.find((p) => p.id === post.id)).toBeUndefined();

      // Post should be marked as deleted in database
      const deletedPost = await repository.findById(post.id);
      expect(deletedPost?.isDeleted).toBe(true);
      expect(deletedPost?.deletedAt).toBeDefined();
      expect(deletedPost?.deletedBy).toBe(user.id);
    });

    it('should only allow author to delete their post', async () => {
      const author = await createTestUser({ username: 'author' });
      const otherUser = await createTestUser({ username: 'other' });

      const post = await createTestPost(author.id, {
        content: 'Author post',
      });

      await expect(service.deletePost(post.id, otherUser.id)).rejects.toThrow(
        'You can only delete your own posts'
      );
    });

    it('should not allow deleting already deleted post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, {
        content: 'Post',
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(service.deletePost(post.id, user.id)).rejects.toThrow(
        'Post is already deleted'
      );
    });
  });

  describe('Get Posts by Author', () => {
    it('should get all posts by specific author', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });

      await createTestPost(user1.id, { content: 'User1 post 1' });
      await createTestPost(user1.id, { content: 'User1 post 2' });
      await createTestPost(user2.id, { content: 'User2 post' });

      const result = await service.getPostsByAuthor(user1.id, 10, 0);

      expect(result.posts).toHaveLength(2);
      expect(result.posts.every((p) => p.author.username === 'user1')).toBe(true);
    });

    it('should exclude deleted posts from author posts', async () => {
      const user = await createTestUser();

      await createTestPost(user.id, { content: 'Active post' });
      await createTestPost(user.id, {
        content: 'Deleted post',
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.getPostsByAuthor(user.id, 10, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]?.content).toBe('Active post');
    });
  });

  describe('End-to-End Post Lifecycle', () => {
    it('should complete full post lifecycle', async () => {
      const user = await createTestUser({
        username: 'lifecycleuser',
        fullName: 'Lifecycle User',
      });

      // 1. Create post
      const created = await service.createPost(user.id, {
        content: 'Initial post content',
      });

      expect(created.post.content).toBe('Initial post content');
      expect(created.post.isEdited).toBe(false);

      // 2. Get post by ID
      const fetched = await service.getPostById(created.post.id);
      expect(fetched.post.id).toBe(created.post.id);

      // 3. Update post
      const updated = await service.updatePost(created.post.id, user.id, {
        content: 'Updated post content',
      });

      expect(updated.post.content).toBe('Updated post content');
      expect(updated.post.isEdited).toBe(true);
      expect(updated.post.editedAt).toBeDefined();

      // 4. Verify in timeline
      const timeline1 = await service.getTimeline(10, 0);
      expect(timeline1.posts.find((p) => p.id === created.post.id)).toBeDefined();

      // 5. Delete post
      await service.deletePost(created.post.id, user.id);

      // 6. Verify not in timeline
      const timeline2 = await service.getTimeline(10, 0);
      expect(timeline2.posts.find((p) => p.id === created.post.id)).toBeUndefined();

      // 7. Verify cannot access deleted post
      await expect(service.getPostById(created.post.id)).rejects.toThrow(
        'Post has been deleted'
      );
    });
  });

  describe('N+1 Query Prevention', () => {
    it('should fetch timeline with constant query count regardless of post count', async () => {
      const user = await createTestUser();

      // Create 5 posts
      for (let i = 1; i <= 5; i++) {
        await createTestPost(user.id, { content: `Post ${i}` });
      }

      // Measure queries for 5 posts
      const { queryCount: queries5Posts } = await countQueries(async (db) => {
        const repo = new PostRepository(db);
        const svc = new PostService(repo);
        return await svc.getTimeline(10, 0);
      });

      // Create 15 more posts (total 20)
      for (let i = 6; i <= 20; i++) {
        await createTestPost(user.id, { content: `Post ${i}` });
      }

      // Measure queries for 20 posts
      const { queryCount: queries20Posts } = await countQueries(async (db) => {
        const repo = new PostRepository(db);
        const svc = new PostService(repo);
        return await svc.getTimeline(20, 0);
      });

      // Query count should be the same regardless of number of posts
      // This proves we're using JOINs, not separate queries per post
      expect(queries5Posts).toBe(queries20Posts);

      // Should be exactly 2 queries:
      // 1. SELECT posts with JOIN users (getTimeline)
      // 2. SELECT COUNT(*) for pagination total
      expect(queries5Posts).toBe(2);
      expect(queries20Posts).toBe(2);
    });

    it('should fetch single post with author in constant queries', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, { content: 'Test post' });

      const { queryCount } = await countQueries(async (db) => {
        const repo = new PostRepository(db);
        const svc = new PostService(repo);
        return await svc.getPostById(post.id);
      });

      // Should be exactly 1 query: SELECT post with JOIN user
      expect(queryCount).toBe(1);
    });

    it('should fetch posts by author with constant query count', async () => {
      const user = await createTestUser();

      // Create 10 posts
      for (let i = 1; i <= 10; i++) {
        await createTestPost(user.id, { content: `Post ${i}` });
      }

      const { queryCount } = await countQueries(async (db) => {
        const repo = new PostRepository(db);
        const svc = new PostService(repo);
        return await svc.getPostsByAuthor(user.id, 10, 0);
      });

      // Should be exactly 1 query: SELECT posts with JOIN users
      // Note: getPostsByAuthor doesn't perform a separate count query
      expect(queryCount).toBe(1);
    });

    it('should not increase queries when fetching many posts from multiple authors', async () => {
      // Create 5 different users
      const users = await Promise.all([
        createTestUser({ username: 'user1' }),
        createTestUser({ username: 'user2' }),
        createTestUser({ username: 'user3' }),
        createTestUser({ username: 'user4' }),
        createTestUser({ username: 'user5' }),
      ]);

      // Each user creates 4 posts (20 total posts, 5 different authors)
      for (const user of users) {
        for (let i = 1; i <= 4; i++) {
          await createTestPost(user.id, { content: `${user.username} post ${i}` });
        }
      }

      const { result, queryCount } = await countQueries(async (db) => {
        const repo = new PostRepository(db);
        const svc = new PostService(repo);
        return await svc.getTimeline(20, 0);
      });

      // Verify we got posts from all 5 authors
      const uniqueAuthors = new Set(result.posts.map((p) => p.author.id));
      expect(uniqueAuthors.size).toBe(5);

      // Query count should still be 2, even with 5 different authors
      // This proves JOIN works correctly with multiple authors
      expect(queryCount).toBe(2);
    });
  });
});

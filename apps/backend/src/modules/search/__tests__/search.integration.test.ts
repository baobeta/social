import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService } from '../search.service.js';
import { SearchRepository } from '../search.repository.js';
import { createTestUser, createTestPost } from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';

/**
 * Integration tests for SearchService
 * Tests with real database and full-text search
 */
describe('SearchService - Integration Tests', () => {
  let service: SearchService;
  let repository: SearchRepository;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new SearchRepository();
    service = new SearchService(repository);
  });

  describe('Unified Search', () => {
    it('should find users by username', async () => {
      await createTestUser({
        username: 'johndoe',
        fullName: 'John Doe',
      });

      const result = await service.search({
        q: 'johndoe',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
      expect(result.results.users[0].username).toBe('johndoe');
    });

    it('should find users by full name', async () => {
      await createTestUser({
        username: 'jsmith',
        fullName: 'Jane Smith',
      });

      const result = await service.search({
        q: 'Jane Smith',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
      expect(result.results.users[0].fullName).toBe('Jane Smith');
    });

    it('should find posts by content', async () => {
      const user = await createTestUser({ username: 'author' });
      await createTestPost(user.id, {
        content: 'This is an article about TypeScript programming',
      });

      const result = await service.search({
        q: 'TypeScript',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.posts.length).toBeGreaterThan(0);
      expect(result.results.posts[0].content).toContain('TypeScript');
    });

    it('should search both users and posts simultaneously', async () => {
      // Create user with "developer" in name
      const user = await createTestUser({
        username: 'devuser',
        fullName: 'Developer User',
      });

      // Create post with "developer" in content
      await createTestPost(user.id, {
        content: 'Tips for becoming a better developer',
      });

      const result = await service.search({
        q: 'developer',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
      expect(result.results.posts.length).toBeGreaterThan(0);
      expect(result.counts.total).toBeGreaterThan(1);
    });

    it('should support partial word matching', async () => {
      await createTestUser({
        username: 'javascript',
        fullName: 'JavaScript Developer',
      });

      // Search with prefix
      const result = await service.search({
        q: 'java',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
    });

    it('should rank results by relevance', async () => {
      const user = await createTestUser({ username: 'postauthor' });

      // Post with "python" mentioned once
      await createTestPost(user.id, {
        content: 'Learning python basics',
      });

      // Post with "python" mentioned multiple times
      await createTestPost(user.id, {
        content: 'Python is great. Python programming is fun. Python rocks!',
      });

      const result = await service.search({
        q: 'python',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      // Should find both posts
      expect(result.results.posts.length).toBe(2);

      // Post with more mentions should rank higher
      expect(result.results.posts[0].relevance).toBeGreaterThan(
        result.results.posts[1].relevance
      );
    });

    it('should exclude soft-deleted posts from results', async () => {
      const user = await createTestUser({ username: 'poster' });

      // Regular post
      await createTestPost(user.id, {
        content: 'Active post about testing',
      });

      // Soft-deleted post
      await createTestPost(user.id, {
        content: 'Deleted post about testing',
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.search({
        q: 'testing',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      // Should only find the active post
      expect(result.results.posts.length).toBe(1);
      expect(result.results.posts[0].content).toBe('Active post about testing');
    });

    it('should handle multi-word search queries', async () => {
      const user = await createTestUser({ username: 'techwriter' });
      await createTestPost(user.id, {
        content: 'Web development with React and Node.js',
      });

      const result = await service.search({
        q: 'React Node.js',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      expect(result.results.posts.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should respect limit parameter', async () => {
      // Create 5 users
      for (let i = 0; i < 5; i++) {
        await createTestUser({
          username: `testuser${i}`,
          fullName: `Test User ${i}`,
        });
      }

      const result = await service.search({
        q: 'Test',
        limit: 3,
        offset: 0,
        type: 'users',
      });

      expect(result.results.users.length).toBeLessThanOrEqual(3);
    });

    it('should support offset for pagination', async () => {
      // Create users with sequential names
      for (let i = 0; i < 5; i++) {
        await createTestUser({
          username: `user${i}`,
          fullName: `User Number ${i}`,
        });
      }

      const firstPage = await service.search({
        q: 'User',
        limit: 2,
        offset: 0,
        type: 'users',
      });

      const secondPage = await service.search({
        q: 'User',
        limit: 2,
        offset: 2,
        type: 'users',
      });

      // Results should be different
      expect(firstPage.results.users[0].id).not.toBe(secondPage.results.users[0].id);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty results for non-matching query', async () => {
      await createTestUser({ username: 'normaluser' });

      const result = await service.search({
        q: 'nonexistentquery',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users).toHaveLength(0);
      expect(result.results.posts).toHaveLength(0);
      expect(result.counts.total).toBe(0);
    });

    it('should handle special characters in search query', async () => {
      const user = await createTestUser({
        username: 'user123',
        fullName: 'User One-Two-Three',
      });

      const result = await service.search({
        q: 'One-Two',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      await createTestUser({
        username: 'testuser',
        fullName: 'Test User',
      });

      const lowercase = await service.search({
        q: 'test',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      const uppercase = await service.search({
        q: 'TEST',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      expect(lowercase.results.users.length).toBe(uppercase.results.users.length);
    });

    it('should handle empty database gracefully', async () => {
      const result = await service.search({
        q: 'anything',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users).toHaveLength(0);
      expect(result.results.posts).toHaveLength(0);
    });
  });

  describe('Search by Type', () => {
    it('should only search users when type is "users"', async () => {
      const user = await createTestUser({
        username: 'developer',
        fullName: 'Dev User',
      });
      await createTestPost(user.id, {
        content: 'Post about developer tools',
      });

      const result = await service.search({
        q: 'developer',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      expect(result.results.users.length).toBeGreaterThan(0);
      expect(result.results.posts).toHaveLength(0);
    });

    it('should only search posts when type is "posts"', async () => {
      const user = await createTestUser({
        username: 'programmer',
        fullName: 'Programmer Name',
      });
      await createTestPost(user.id, {
        content: 'Article about programming',
      });

      const result = await service.search({
        q: 'programming',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      expect(result.results.posts.length).toBeGreaterThan(0);
      expect(result.results.users).toHaveLength(0);
    });
  });

  describe('Author Information in Posts', () => {
    it('should include author details in post results', async () => {
      const user = await createTestUser({
        username: 'postauthor',
        fullName: 'Post Author',
        displayName: 'PA',
      });

      await createTestPost(user.id, {
        content: 'Test post content here',
      });

      const result = await service.search({
        q: 'post',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      expect(result.results.posts[0].author).toBeDefined();
      expect(result.results.posts[0].author.username).toBe('postauthor');
      expect(result.results.posts[0].author.fullName).toBe('Post Author');
      expect(result.results.posts[0].author.displayName).toBe('PA');
    });
  });

  describe('Count Accuracy', () => {
    it('should return accurate counts', async () => {
      // Create 3 users matching "developer"
      for (let i = 0; i < 3; i++) {
        await createTestUser({
          username: `dev${i}`,
          fullName: `Developer ${i}`,
        });
      }

      // Create 2 posts matching "developer"
      const user = await createTestUser({ username: 'author' });
      for (let i = 0; i < 2; i++) {
        await createTestPost(user.id, {
          content: `Developer post ${i}`,
        });
      }

      const result = await service.search({
        q: 'developer',
        limit: 100,
        offset: 0,
        type: 'all',
      });

      expect(result.counts.users).toBe(3);
      expect(result.counts.posts).toBe(2);
      expect(result.counts.total).toBe(5);
    });
  });
});

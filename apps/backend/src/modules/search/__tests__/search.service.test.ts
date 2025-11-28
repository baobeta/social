import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../search.service.js';
import { SearchRepository } from '../search.repository.js';
import type { User, Post } from '../../../db/schema/index.js';

/**
 * Unit tests for SearchService
 * Tests business logic in isolation using mocked repository
 */
describe('SearchService - Unit Tests', () => {
  let service: SearchService;
  let mockRepository: any;

  const mockUser: User & { relevance: number } = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'johndoe',
    password: 'hashed_password',
    fullName: 'John Doe',
    displayName: 'Johnny',
    role: 'user',
    searchVector: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    relevance: 0.85,
  };

  const mockPost: Post & {
    relevance: number;
    author: {
      id: string;
      username: string;
      fullName: string;
      displayName: string | null;
    };
  } = {
    id: '223e4567-e89b-12d3-a456-426614174001',
    content: 'This is a test post about TypeScript',
    authorId: mockUser.id,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    isEdited: false,
    editedAt: null,
    editedBy: null,
    searchVector: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    relevance: 0.92,
    author: {
      id: mockUser.id,
      username: mockUser.username,
      fullName: mockUser.fullName,
      displayName: mockUser.displayName,
    },
  };

  beforeEach(() => {
    mockRepository = {
      searchUsers: vi.fn(),
      searchPosts: vi.fn(),
      countUsers: vi.fn(),
      countPosts: vi.fn(),
    };

    service = new SearchService(mockRepository);
  });

  describe('search', () => {
    it('should search both users and posts when type is "all"', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);
      mockRepository.searchPosts.mockResolvedValue([mockPost]);
      mockRepository.countUsers.mockResolvedValue(1);
      mockRepository.countPosts.mockResolvedValue(1);

      const result = await service.search({
        q: 'test query',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(mockRepository.searchUsers).toHaveBeenCalledWith('test query', 10, 0);
      expect(mockRepository.searchPosts).toHaveBeenCalledWith('test query', 10, 0);
      expect(result.results.users).toHaveLength(1);
      expect(result.results.posts).toHaveLength(1);
      expect(result.counts.total).toBe(2);
    });

    it('should search only users when type is "users"', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);
      mockRepository.countUsers.mockResolvedValue(1);

      const result = await service.search({
        q: 'john',
        limit: 20,
        offset: 0,
        type: 'users',
      });

      expect(mockRepository.searchUsers).toHaveBeenCalled();
      expect(mockRepository.searchPosts).not.toHaveBeenCalled();
      expect(result.results.users).toHaveLength(1);
      expect(result.results.posts).toHaveLength(0);
    });

    it('should search only posts when type is "posts"', async () => {
      mockRepository.searchPosts.mockResolvedValue([mockPost]);
      mockRepository.countPosts.mockResolvedValue(1);

      const result = await service.search({
        q: 'typescript',
        limit: 20,
        offset: 0,
        type: 'posts',
      });

      expect(mockRepository.searchPosts).toHaveBeenCalled();
      expect(mockRepository.searchUsers).not.toHaveBeenCalled();
      expect(result.results.posts).toHaveLength(1);
      expect(result.results.users).toHaveLength(0);
    });

    it('should not expose passwords in user results', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);
      mockRepository.searchPosts.mockResolvedValue([]);
      mockRepository.countUsers.mockResolvedValue(1);
      mockRepository.countPosts.mockResolvedValue(0);

      const result = await service.search({
        q: 'john',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users[0]).not.toHaveProperty('password');
    });

    it('should include relevance scores in results', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);
      mockRepository.searchPosts.mockResolvedValue([mockPost]);
      mockRepository.countUsers.mockResolvedValue(1);
      mockRepository.countPosts.mockResolvedValue(1);

      const result = await service.search({
        q: 'test',
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.results.users[0].relevance).toBe(0.85);
      expect(result.results.posts[0].relevance).toBe(0.92);
    });

    it('should throw error for empty query', async () => {
      await expect(
        service.search({
          q: '',
          limit: 20,
          offset: 0,
          type: 'all',
        })
      ).rejects.toThrow('Search query cannot be empty');
    });

    it('should handle pagination parameters', async () => {
      mockRepository.searchUsers.mockResolvedValue([]);
      mockRepository.searchPosts.mockResolvedValue([]);
      mockRepository.countUsers.mockResolvedValue(0);
      mockRepository.countPosts.mockResolvedValue(0);

      const result = await service.search({
        q: 'test',
        limit: 50,
        offset: 10,
        type: 'all',
      });

      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(10);
    });
  });

  describe('searchUsers', () => {
    it('should search users only', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);

      const result = await service.searchUsers('john', 20, 0);

      expect(mockRepository.searchUsers).toHaveBeenCalledWith('john', 20, 0);
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('johndoe');
    });

    it('should not expose passwords', async () => {
      mockRepository.searchUsers.mockResolvedValue([mockUser]);

      const result = await service.searchUsers('john', 20, 0);

      expect(result[0]).not.toHaveProperty('password');
    });

    it('should throw error for empty query', async () => {
      await expect(service.searchUsers('', 20, 0)).rejects.toThrow(
        'Search query cannot be empty'
      );
    });
  });

  describe('searchPosts', () => {
    it('should search posts only', async () => {
      mockRepository.searchPosts.mockResolvedValue([mockPost]);

      const result = await service.searchPosts('typescript', 20, 0);

      expect(mockRepository.searchPosts).toHaveBeenCalledWith('typescript', 20, 0);
      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('TypeScript');
    });

    it('should include author information', async () => {
      mockRepository.searchPosts.mockResolvedValue([mockPost]);

      const result = await service.searchPosts('typescript', 20, 0);

      expect(result[0].author).toBeDefined();
      expect(result[0].author.username).toBe('johndoe');
      expect(result[0].author.fullName).toBe('John Doe');
    });

    it('should throw error for empty query', async () => {
      await expect(service.searchPosts('', 20, 0)).rejects.toThrow(
        'Search query cannot be empty'
      );
    });
  });
});

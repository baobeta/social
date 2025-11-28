import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../user.service.js';
import { UserRepository } from '../user.repository.js';
import type { User } from '../../../db/schema/index.js';

/**
 * Unit tests for UserService
 * Tests business logic in isolation using mocked repository
 */
describe('UserService - Unit Tests', () => {
  let service: UserService;
  let mockRepository: any;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    password: 'hashed_password',
    fullName: 'Test User',
    displayName: 'Tester',
    role: 'user',
    searchVector: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn(),
      findByUsername: vi.fn(),
    };

    // Create service with mocked repository
    service = new UserService(mockRepository);
  });

  describe('getUserById', () => {
    it('should return user profile without password', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        fullName: mockUser.fullName,
        displayName: mockUser.displayName,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.getUserById('non-existent-id')).rejects.toThrow('User not found');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('updateProfile', () => {
    it('should update full name only', async () => {
      const updateData = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date('2024-01-02') };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockRepository.updateProfile).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result.user.fullName).toBe('Updated Name');
      expect(result.user.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should update display name only', async () => {
      const updateData = { displayName: 'New Display Name' };
      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date('2024-01-02') };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateData);

      expect(mockRepository.updateProfile).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result.user.displayName).toBe('New Display Name');
    });

    it('should update both full name and display name', async () => {
      const updateData = { fullName: 'New Full Name', displayName: 'New Display' };
      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date('2024-01-02') };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateData);

      expect(mockRepository.updateProfile).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result.user.fullName).toBe('New Full Name');
      expect(result.user.displayName).toBe('New Display');
    });

    it('should allow setting display name to null', async () => {
      const updateData = { displayName: null };
      const updatedUser = { ...mockUser, displayName: null, updatedAt: new Date('2024-01-02') };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateData);

      expect(mockRepository.updateProfile).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result.user.displayName).toBeNull();
    });

    it('should throw error if user not found', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(
        service.updateProfile('non-existent-id', { fullName: 'New Name' })
      ).rejects.toThrow('User not found');

      expect(mockRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw error if no fields to update', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      await expect(service.updateProfile(mockUser.id, {})).rejects.toThrow(
        'No fields to update'
      );

      expect(mockRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should not expose password in response', async () => {
      const updateData = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateData);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getUserByUsername', () => {
    it('should return user profile by username', async () => {
      mockRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.getUserByUsername(mockUser.username);

      expect(mockRepository.findByUsername).toHaveBeenCalledWith(mockUser.username);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        fullName: mockUser.fullName,
        displayName: mockUser.displayName,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      mockRepository.findByUsername.mockResolvedValue(undefined);

      await expect(service.getUserByUsername('nonexistent')).rejects.toThrow('User not found');
      expect(mockRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle case-sensitive usernames', async () => {
      mockRepository.findByUsername.mockResolvedValue(undefined);

      await expect(service.getUserByUsername('TestUser')).rejects.toThrow('User not found');
      expect(mockRepository.findByUsername).toHaveBeenCalledWith('TestUser');
    });
  });
});

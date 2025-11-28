import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../user.service.js';
import { UserRepository } from '../user.repository.js';
import { createTestUser } from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';

/**
 * Integration tests for UserService
 * Tests with real database operations
 */
describe('UserService - Integration Tests', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new UserRepository();
    service = new UserService(repository);
  });

  describe('getUserById', () => {
    it('should retrieve user from database', async () => {
      const testUser = await createTestUser({
        username: 'integrationuser',
        fullName: 'Integration Test User',
        displayName: 'IntTest',
      });

      const result = await service.getUserById(testUser.id);

      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe('integrationuser');
      expect(result.fullName).toBe('Integration Test User');
      expect(result.displayName).toBe('IntTest');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getUserById(fakeId)).rejects.toThrow('User not found');
    });

    it('should handle UUID validation', async () => {
      // Valid UUID format but doesn't exist
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(service.getUserById(nonExistentId)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update full name in database', async () => {
      const testUser = await createTestUser({
        username: 'updatetest',
        fullName: 'Original Name',
      });

      const result = await service.updateProfile(testUser.id, {
        fullName: 'Updated Name',
      });

      expect(result.user.fullName).toBe('Updated Name');
      expect(result.user.updatedAt).not.toEqual(testUser.updatedAt);

      // Verify in database
      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.fullName).toBe('Updated Name');
    });

    it('should update display name in database', async () => {
      const testUser = await createTestUser({
        username: 'displaytest',
        displayName: 'Old Display',
      });

      const result = await service.updateProfile(testUser.id, {
        displayName: 'New Display',
      });

      expect(result.user.displayName).toBe('New Display');

      // Verify in database
      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.displayName).toBe('New Display');
    });

    it('should update both fields simultaneously', async () => {
      const testUser = await createTestUser({
        username: 'bothfields',
        fullName: 'Old Full Name',
        displayName: 'Old Display',
      });

      const result = await service.updateProfile(testUser.id, {
        fullName: 'New Full Name',
        displayName: 'New Display Name',
      });

      expect(result.user.fullName).toBe('New Full Name');
      expect(result.user.displayName).toBe('New Display Name');

      // Verify in database
      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.fullName).toBe('New Full Name');
      expect(dbUser?.displayName).toBe('New Display Name');
    });

    it('should allow clearing display name', async () => {
      const testUser = await createTestUser({
        username: 'cleardisplay',
        displayName: 'Has Display Name',
      });

      const result = await service.updateProfile(testUser.id, {
        displayName: null,
      });

      expect(result.user.displayName).toBeNull();

      // Verify in database
      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.displayName).toBeNull();
    });

    it('should update timestamp when profile is updated', async () => {
      const testUser = await createTestUser({
        username: 'timestamptest',
      });

      const originalUpdatedAt = testUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.updateProfile(testUser.id, {
        fullName: 'Updated Name',
      });

      expect(result.user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not affect other users when updating', async () => {
      const user1 = await createTestUser({ username: 'user1', fullName: 'User One' });
      const user2 = await createTestUser({ username: 'user2', fullName: 'User Two' });

      // Update user1
      await service.updateProfile(user1.id, { fullName: 'Updated User One' });

      // Verify user2 unchanged
      const user2AfterUpdate = await repository.findById(user2.id);
      expect(user2AfterUpdate?.fullName).toBe('User Two');
    });

    it('should preserve username and role when updating profile', async () => {
      const testUser = await createTestUser({
        username: 'preservetest',
        role: 'user',
      });

      await service.updateProfile(testUser.id, {
        fullName: 'New Name',
      });

      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.username).toBe('preservetest');
      expect(dbUser?.role).toBe('user');
    });

    it('should handle multiple updates to same user', async () => {
      const testUser = await createTestUser({
        username: 'multiupdate',
        fullName: 'Original',
      });

      // First update
      await service.updateProfile(testUser.id, { fullName: 'First Update' });

      // Second update
      await service.updateProfile(testUser.id, { fullName: 'Second Update' });

      // Third update
      const finalResult = await service.updateProfile(testUser.id, {
        fullName: 'Final Update',
      });

      expect(finalResult.user.fullName).toBe('Final Update');

      // Verify in database
      const dbUser = await repository.findById(testUser.id);
      expect(dbUser?.fullName).toBe('Final Update');
    });
  });

  describe('getUserByUsername', () => {
    it('should retrieve user by username from database', async () => {
      const testUser = await createTestUser({
        username: 'usernamesearch',
        fullName: 'Username Search User',
      });

      const result = await service.getUserByUsername('usernamesearch');

      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe('usernamesearch');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for non-existent username', async () => {
      await expect(service.getUserByUsername('nonexistentuser')).rejects.toThrow(
        'User not found'
      );
    });

    it('should be case-sensitive for usernames', async () => {
      await createTestUser({ username: 'CaseSensitive' });

      // Exact match should work
      const result = await service.getUserByUsername('CaseSensitive');
      expect(result.username).toBe('CaseSensitive');

      // Different case should not work
      await expect(service.getUserByUsername('casesensitive')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('End-to-end user profile flow', () => {
    it('should complete full user profile lifecycle', async () => {
      // 1. Create user
      const testUser = await createTestUser({
        username: 'lifecycleuser',
        fullName: 'Lifecycle Test User',
        displayName: 'Lifecycle',
      });

      // 2. Get user by ID
      const userById = await service.getUserById(testUser.id);
      expect(userById.username).toBe('lifecycleuser');

      // 3. Get user by username
      const userByUsername = await service.getUserByUsername('lifecycleuser');
      expect(userByUsername.id).toBe(testUser.id);

      // 4. Update full name
      const updated1 = await service.updateProfile(testUser.id, {
        fullName: 'Updated Full Name',
      });
      expect(updated1.user.fullName).toBe('Updated Full Name');

      // 5. Update display name
      const updated2 = await service.updateProfile(testUser.id, {
        displayName: 'New Display',
      });
      expect(updated2.user.displayName).toBe('New Display');

      // 6. Clear display name
      const updated3 = await service.updateProfile(testUser.id, {
        displayName: null,
      });
      expect(updated3.user.displayName).toBeNull();

      // 7. Final verification
      const finalUser = await service.getUserById(testUser.id);
      expect(finalUser.fullName).toBe('Updated Full Name');
      expect(finalUser.displayName).toBeNull();
    });
  });
});

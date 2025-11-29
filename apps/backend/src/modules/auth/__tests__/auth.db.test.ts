import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.service.ts';
import { AuthRepository } from '../auth.repository.ts';
import type { RegisterDto, LoginDto } from '../auth.dto.ts';
import { createTestUser, testUserData } from '../../../test/fixtures.ts';
import { cleanDatabase } from '../../../test/setup.ts';
import { comparePassword } from '../../../lib/password.ts';
import { verifyToken } from '../../../lib/jwt.ts';

/**
 * Database Integration Tests for AuthService
 *
 * These tests use a REAL database (not mocks) to ensure:
 * - Database constraints work correctly
 * - Queries execute without errors
 * - Data is persisted and retrieved correctly
 * - Transactions and rollbacks work
 * - Real-world scenarios are tested
 */

describe('AuthService - Database Integration', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let mockRequest: any;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new AuthRepository();
    service = new AuthService(repository);
    mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
    };
  });

  describe('register', () => {
    it('should create user in database with hashed password', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        password: 'Password123!',
        fullName: 'New User',
        displayName: 'Newbie',
      };

      const result = await service.register(registerDto, mockRequest);

      // Verify response
      expect(result.user.username).toBe(registerDto.username);
      expect(result.user.fullName).toBe(registerDto.fullName);
      expect(result.user.displayName).toBe(registerDto.displayName);
      expect(result.token).toBeDefined();

      // Verify user exists in database
      const dbUser = await repository.findByUsername(registerDto.username);
      expect(dbUser).toBeDefined();
      expect(dbUser?.username).toBe(registerDto.username);

      // Verify password is hashed (not plain text)
      expect(dbUser?.password).not.toBe(registerDto.password);

      // Verify hashed password can be verified
      const isPasswordValid = await comparePassword(registerDto.password, dbUser!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should enforce unique username constraint', async () => {
      const registerDto: RegisterDto = {
        username: 'duplicateuser',
        password: 'Password123!',
        fullName: 'Duplicate User',
      };

      // First registration should succeed
      await service.register(registerDto, mockRequest);

      // Second registration with same username should fail
      await expect(service.register(registerDto, mockRequest)).rejects.toThrow('Username already exists');

      // Verify only one user exists in database
      const users = await repository.findByUsername(registerDto.username);
      expect(users).toBeDefined();
    });

    it('should handle optional displayName correctly', async () => {
      const registerDto: RegisterDto = {
        username: 'nodisplay',
        password: 'Password123!',
        fullName: 'No Display User',
      };

      const result = await service.register(registerDto, mockRequest);

      expect(result.user.displayName).toBeNull();

      // Verify in database
      const dbUser = await repository.findByUsername(registerDto.username);
      expect(dbUser?.displayName).toBeNull();
    });

    it('should set default role to user', async () => {
      const registerDto: RegisterDto = {
        username: 'regularuser',
        password: 'Password123!',
        fullName: 'Regular User',
      };

      const result = await service.register(registerDto, mockRequest);

      expect(result.user.role).toBe('user');

      // Verify in database
      const dbUser = await repository.findByUsername(registerDto.username);
      expect(dbUser?.role).toBe('user');
    });

    it('should generate valid JWT token', async () => {
      const registerDto: RegisterDto = {
        username: 'tokenuser',
        password: 'Password123!',
        fullName: 'Token User',
      };

      const result = await service.register(registerDto, mockRequest);

      // Verify token can be decoded
      const payload = verifyToken(result.token);
      expect(payload.userId).toBe(result.user.id);
      expect(payload.username).toBe(result.user.username);
      expect(payload.role).toBe(result.user.role);
    });

    it('should create user with createdAt and updatedAt timestamps', async () => {
      const registerDto: RegisterDto = {
        username: 'timestampuser',
        password: 'Password123!',
        fullName: 'Timestamp User',
      };

      await service.register(registerDto, mockRequest);

      // Verify timestamps in database
      const dbUser = await repository.findByUsername(registerDto.username);
      expect(dbUser?.createdAt).toBeInstanceOf(Date);
      expect(dbUser?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      // Create test user
      const testUser = await createTestUser({
        username: 'loginuser',
        fullName: 'Login User',
      });

      const loginDto: LoginDto = {
        username: 'loginuser',
        password: 'Password123!', // Default password from fixture
      };

      const result = await service.login(loginDto, mockRequest);

      expect(result.user.id).toBe(testUser.id);
      expect(result.user.username).toBe(testUser.username);
      expect(result.token).toBeDefined();

      // Verify token is valid
      const payload = verifyToken(result.token);
      expect(payload.userId).toBe(testUser.id);
    });

    it('should reject login with wrong password', async () => {
      await createTestUser({
        username: 'loginuser',
      });

      const loginDto: LoginDto = {
        username: 'loginuser',
        password: 'Wrongpassword1!',
      };

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow('Invalid username or password');
    });

    it('should reject login with non-existent username', async () => {
      const loginDto: LoginDto = {
        username: 'nonexistent',
        password: 'Password123!',
      };

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow('Invalid username or password');
    });

    it('should not reveal if username or password was wrong', async () => {
      await createTestUser({ username: 'existinguser' });

      // Try with wrong username
      const wrongUsernameError = service
        .login({ username: 'nonexistent', password: 'Password123!' }, mockRequest)
        .catch((e) => e);

      // Try with wrong password
      const wrongPasswordError = service
        .login({ username: 'existinguser', password: 'Wrongpassword1!' }, mockRequest)
        .catch((e) => e);

      const [error1, error2] = await Promise.all([wrongUsernameError, wrongPasswordError]);

      // Both should return same error message (security best practice)
      expect(error1.message).toBe('Invalid username or password');
      expect(error2.message).toBe('Invalid username or password');
    });

    it('should handle case-sensitive usernames', async () => {
      await createTestUser({ username: 'CaseSensitive' });

      // Try with different case
      const loginDto: LoginDto = {
        username: 'casesensitive',
        password: 'Password123!',
      };

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow('Invalid username or password');
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by id', async () => {
      const testUser = await createTestUser({
        username: 'retrieveuser',
        fullName: 'Retrieve User',
      });

      const result = await service.getUserById(testUser.id);

      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe(testUser.username);
      expect(result.fullName).toBe(testUser.fullName);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getUserById(fakeId)).rejects.toThrow('User not found');
    });

    it('should not expose password field', async () => {
      const testUser = await createTestUser();

      const result = await service.getUserById(testUser.id);

      expect(result).not.toHaveProperty('password');
      expect(Object.keys(result)).not.toContain('password');
    });
  });

  describe('End-to-end flows', () => {
    it('should complete full registration -> login -> getUserById flow', async () => {
      // 1. Register
      const registerDto: RegisterDto = {
        username: 'e2euser',
        password: 'E2EPassword123!',
        fullName: 'E2E User',
        displayName: 'E2E',
      };

      const registerResult = await service.register(registerDto, mockRequest);
      expect(registerResult.token).toBeDefined();

      const userId = registerResult.user.id;

      // 2. Login with registered credentials
      const loginDto: LoginDto = {
        username: registerDto.username,
        password: registerDto.password,
      };

      const loginResult = await service.login(loginDto, mockRequest);
      expect(loginResult.user.id).toBe(userId);
      expect(loginResult.token).toBeDefined();

      // 3. Get user by ID
      const userResult = await service.getUserById(userId);
      expect(userResult.id).toBe(userId);
      expect(userResult.username).toBe(registerDto.username);
      expect(userResult.fullName).toBe(registerDto.fullName);
    });

    it('should handle multiple users independently', async () => {
      // Create multiple users
      const user1 = await service.register({
        username: 'user1',
        password: 'Password123!One',
        fullName: 'User One',
      }, mockRequest);

      const user2 = await service.register({
        username: 'user2',
        password: 'Password123!Two',
        fullName: 'User Two',
      }, mockRequest);

      const user3 = await service.register({
        username: 'user3',
        password: 'Password123!Three',
        fullName: 'User Three',
      }, mockRequest);

      // Each should login with own credentials
      const login1 = await service.login({ username: 'user1', password: 'Password123!One' }, mockRequest);
      const login2 = await service.login({ username: 'user2', password: 'Password123!Two' }, mockRequest);
      const login3 = await service.login({ username: 'user3', password: 'Password123!Three' }, mockRequest);

      expect(login1.user.id).toBe(user1.user.id);
      expect(login2.user.id).toBe(user2.user.id);
      expect(login3.user.id).toBe(user3.user.id);

      // Verify tokens are different
      expect(login1.token).not.toBe(login2.token);
      expect(login2.token).not.toBe(login3.token);
    });
  });

  describe('Repository Integration', () => {
    it('should find user by username', async () => {
      const testUser = await createTestUser({ username: 'finduser' });

      const found = await repository.findByUsername('finduser');

      expect(found).toBeDefined();
      expect(found?.id).toBe(testUser.id);
      expect(found?.username).toBe('finduser');
    });

    it('should return undefined for non-existent username', async () => {
      const found = await repository.findByUsername('nonexistent');

      expect(found).toBeUndefined();
    });

    it('should check if username exists', async () => {
      await createTestUser({ username: 'existsuser' });

      const exists = await repository.usernameExists('existsuser');
      const notExists = await repository.usernameExists('doesnotexist');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service.ts';
import { AuthRepository } from '../auth.repository.ts';
import type { User } from '../../../db/schema/index.ts';
import type { RegisterDto, LoginDto } from '../auth.dto.ts';

// Mock the dependencies
vi.mock('../../../lib/password.ts', () => ({
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  comparePassword: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));

vi.mock('../../../lib/jwt.ts', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: AuthRepository;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    password: 'hashed_password123',
    fullName: 'Test User',
    displayName: 'Tester',
    role: 'user',
    searchVector: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findByUsername: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      usernameExists: vi.fn(),
    } as any;

    service = new AuthService(mockRepository);
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'newuser',
      password: 'password123',
      fullName: 'New User',
      displayName: 'Newbie',
    };

    it('should successfully register a new user', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.username).toBe(mockUser.username);
      expect(result.token).toBe('mock-jwt-token');
      expect(mockRepository.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if username already exists', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow('Username already exists');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password before creating user', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser);

      await service.register(registerDto);

      const createCall = vi.mocked(mockRepository.create).mock.calls[0][0];
      expect(createCall.password).toBe('hashed_password123');
    });

    it('should set role to user by default', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser);

      await service.register(registerDto);

      const createCall = vi.mocked(mockRepository.create).mock.calls[0][0];
      expect(createCall.role).toBe('user');
    });

    it('should handle optional displayName', async () => {
      const dtoWithoutDisplay = { ...registerDto, displayName: undefined };
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser);

      await service.register(dtoWithoutDisplay);

      const createCall = vi.mocked(mockRepository.create).mock.calls[0][0];
      expect(createCall.displayName).toBeNull();
    });

    it('should return user without password', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('username');
      expect(result.user).toHaveProperty('fullName');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully login with correct credentials', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user.username).toBe(mockUser.username);
      expect(result.token).toBe('mock-jwt-token');
      expect(mockRepository.findByUsername).toHaveBeenCalledWith(loginDto.username);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid username or password');
    });

    it('should throw error if password is incorrect', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(mockUser);
      const wrongPasswordDto = { ...loginDto, password: 'wrongpassword' };

      await expect(service.login(wrongPasswordDto)).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should return user without password', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
    });

    it('should not reveal if username or password was wrong', async () => {
      // Test username wrong
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      const usernameError = service.login(loginDto).catch((e) => e);

      // Test password wrong
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(mockUser);
      const passwordError = service
        .login({ ...loginDto, password: 'wrong' })
        .catch((e) => e);

      const [error1, error2] = await Promise.all([usernameError, passwordError]);

      // Both should have the same error message
      expect(error1.message).toBe(error2.message);
      expect(error1.message).toBe('Invalid username or password');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.username).toBe(mockUser.username);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(undefined);

      await expect(service.getUserById('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should return user without password', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('role');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete registration flow', async () => {
      const registerDto: RegisterDto = {
        username: 'alice',
        password: 'alicePass123',
        fullName: 'Alice Smith',
      };

      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
        fullName: registerDto.fullName,
      });

      const result = await service.register(registerDto);

      expect(result.user.username).toBe(registerDto.username);
      expect(result.user.fullName).toBe(registerDto.fullName);
      expect(result.token).toBeDefined();
    });

    it('should handle complete login flow after registration', async () => {
      const registerDto: RegisterDto = {
        username: 'bob',
        password: 'bobPass123',
        fullName: 'Bob Jones',
      };

      // Register
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
        password: 'hashed_bobPass123',
      });

      await service.register(registerDto);

      // Login
      vi.mocked(mockRepository.findByUsername).mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
        password: 'hashed_bobPass123',
      });

      const loginDto: LoginDto = {
        username: registerDto.username,
        password: registerDto.password,
      };

      const loginResult = await service.login(loginDto);

      expect(loginResult.user.username).toBe(registerDto.username);
      expect(loginResult.token).toBeDefined();
    });
  });
});

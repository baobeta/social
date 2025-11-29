import { hashPassword, comparePassword } from '../../lib/password.ts';
import { generateAccessToken, generateRefreshToken } from '../../lib/jwt.ts';
import { generateInitials } from '../../lib/initials.js';
import { validatePasswordStrength } from '../../lib/password-validator.js';
import { AuthRepository } from './auth.repository.ts';
import { RefreshTokenRepository } from './refresh-token.repository.ts';
import type { RegisterDto, LoginDto, AuthResponse } from './auth.dto.ts';
import type { Request } from 'express';

export class AuthService {
  private repository: AuthRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor(
    repository: AuthRepository = new AuthRepository(),
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository()
  ) {
    this.repository = repository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  /**
   * Register a new user
   * @throws Error if username already exists or password is weak
   */
  async register(data: RegisterDto, req: Request): Promise<AuthResponse> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if username already exists
    const existingUser = await this.repository.findByUsername(data.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash the password
    const hashedPassword = await hashPassword(data.password);

    // Create the user
    const user = await this.repository.create({
      username: data.username,
      password: hashedPassword,
      fullName: data.fullName,
      displayName: data.displayName || null,
      initials: generateInitials(data.fullName),
      role: data.role || 'user', // Default to 'user' role if not provided
    });

    // Generate access token (short-lived, 15 minutes)
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Generate refresh token (long-lived, 7 days)
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Login a user
   * @throws Error if credentials are invalid
   */
  async login(data: LoginDto, req: Request): Promise<AuthResponse> {
    // Find user by username
    const user = await this.repository.findByUsername(data.username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate access token (short-lived, 15 minutes)
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Generate refresh token (long-lived, 7 days)
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   * @throws Error if refresh token is invalid or expired
   */
  async refreshAccessToken(refreshTokenValue: string): Promise<{ token: string }> {
    // Validate refresh token
    const refreshToken = await this.refreshTokenRepository.findValidToken(refreshTokenValue);
    if (!refreshToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.repository.findById(refreshToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return { token: accessToken };
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshTokenValue: string): Promise<void> {
    await this.refreshTokenRepository.revokeToken(refreshTokenValue);
  }

  /**
   * Get user by ID (for auth middleware)
   */
  async getUserById(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      role: user.role,
    };
  }
}

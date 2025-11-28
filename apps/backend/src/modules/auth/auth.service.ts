import { hashPassword, comparePassword } from '../../lib/password.ts';
import { generateToken } from '../../lib/jwt.ts';
import { generateInitials } from '../../lib/initials.js';
import { AuthRepository } from './auth.repository.ts';
import type { RegisterDto, LoginDto, AuthResponse } from './auth.dto.ts';

export class AuthService {
  private repository: AuthRepository;

  constructor(repository: AuthRepository = new AuthRepository()) {
    this.repository = repository;
  }

  /**
   * Register a new user
   * @throws Error if username already exists
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
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
      role: 'user',
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login a user
   * @throws Error if credentials are invalid
   */
  async login(data: LoginDto): Promise<AuthResponse> {
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

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
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

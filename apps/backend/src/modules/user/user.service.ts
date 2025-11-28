import { UserRepository } from './user.repository.js';
import type { UpdateProfileDto, UserResponse, UpdateProfileResponse } from './user.dto.js';
import { generateInitials } from '../../lib/initials.js';

/**
 * Service for user profile management
 * Contains business logic for user operations
 */
export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.repository = repository;
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile without password
   * @throws Error if user not found
   */
  async getUserById(userId: string): Promise<UserResponse> {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   * Users can update their own full name and display name
   * @param userId - User ID (from authentication)
   * @param data - Profile data to update
   * @returns Updated user profile
   * @throws Error if user not found or validation fails
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto
  ): Promise<UpdateProfileResponse> {
    // Verify user exists
    const existingUser = await this.repository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if there's actually something to update
    if (!data.fullName && data.displayName === undefined) {
      throw new Error('No fields to update');
    }

    // Build update data object (only include fields that were provided)
    const updateData: { fullName?: string; displayName?: string | null; initials?: string } = {};

    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
      updateData.initials = generateInitials(data.fullName); // Regenerate initials when name changes
    }

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }

    // Update the user
    const updatedUser = await this.repository.updateProfile(userId, updateData);

    return {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  /**
   * Get user profile by username
   * @param username - Username to search for
   * @returns User profile without password
   * @throws Error if user not found
   */
  async getUserByUsername(username: string): Promise<UserResponse> {
    const user = await this.repository.findByUsername(username);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

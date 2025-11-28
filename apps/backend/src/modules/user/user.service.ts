import { UserRepository } from './user.repository.js';
import type { UpdateProfileDto, UserResponse, UpdateProfileResponse } from './user.dto.js';
import { generateInitials } from '../../lib/initials.js';
import { AuthorizationService, type AuthUser, type UserRole } from '../../lib/authorization.js';

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
   * Users can update their own profile, admins can update any profile
   * @param user - Authenticated user (from authentication middleware)
   * @param targetUserId - ID of the user profile to update
   * @param data - Profile data to update
   * @returns Updated user profile
   * @throws Error if user not found, lacks permission, or validation fails
   */
  async updateProfile(
    user: AuthUser,
    targetUserId: string,
    data: UpdateProfileDto
  ): Promise<UpdateProfileResponse> {
    // Check permission
    if (!AuthorizationService.canUpdateProfile(user, targetUserId)) {
      throw new Error('You do not have permission to update this profile');
    }

    // Verify target user exists
    const existingUser = await this.repository.findById(targetUserId);
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
    const updatedUser = await this.repository.updateProfile(targetUserId, updateData);

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

  /**
   * Update user role (admin only)
   * Admins cannot downgrade themselves
   * @param admin - Authenticated admin user
   * @param targetUserId - ID of user whose role to update
   * @param newRole - New role to assign
   * @returns Updated user profile
   * @throws Error if not admin, trying to self-downgrade, or user not found
   */
  async updateUserRole(
    admin: AuthUser,
    targetUserId: string,
    newRole: UserRole
  ): Promise<UpdateProfileResponse> {
    // Check if user can change role (includes self-downgrade check)
    const permissionCheck = AuthorizationService.canChangeRole(admin, targetUserId, newRole);

    if (!permissionCheck.allowed) {
      throw new Error(permissionCheck.reason || 'Permission denied');
    }

    // Verify target user exists
    const targetUser = await this.repository.findById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Update the role
    const updatedUser = await this.repository.updateRole(targetUserId, newRole);

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
}

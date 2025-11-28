/**
 * Centralized authorization service
 * Handles all permission checks across the application
 */

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
}

/**
 * Authorization service for checking permissions
 */
export class AuthorizationService {
  /**
   * Check if user is an admin
   */
  static isAdmin(user: AuthUser): boolean {
    return user.role === 'admin';
  }

  /**
   * Check if user can edit a resource (post or comment)
   * Rules: Author can edit their own content, admin can edit all content
   */
  static canEditResource(user: AuthUser, resourceAuthorId: string): boolean {
    // Admin can edit anything
    if (this.isAdmin(user)) {
      return true;
    }

    // Author can edit their own content
    return user.userId === resourceAuthorId;
  }

  /**
   * Check if user can delete a resource (post or comment)
   * Rules: Same as edit - author or admin
   */
  static canDeleteResource(user: AuthUser, resourceAuthorId: string): boolean {
    return this.canEditResource(user, resourceAuthorId);
  }

  /**
   * Check if user can update a profile
   * Rules: User can update their own profile, admin can update any profile
   */
  static canUpdateProfile(user: AuthUser, targetUserId: string): boolean {
    // Admin can update any profile
    if (this.isAdmin(user)) {
      return true;
    }

    // User can update their own profile
    return user.userId === targetUserId;
  }

  /**
   * Check if user can change a role
   * Rules:
   * - Only admins can change roles
   * - Admin cannot downgrade themselves
   * - Admin can change other users' roles
   */
  static canChangeRole(
    user: AuthUser,
    targetUserId: string,
    newRole: UserRole
  ): { allowed: boolean; reason?: string } {
    // Only admins can change roles
    if (!this.isAdmin(user)) {
      return { allowed: false, reason: 'Only admins can change user roles' };
    }

    // Admin trying to change their own role to user (self-downgrade)
    if (user.userId === targetUserId && newRole === 'user') {
      return {
        allowed: false,
        reason: 'Admins cannot downgrade their own role',
      };
    }

    // Admin can change other users' roles or keep their own admin role
    return { allowed: true };
  }

  /**
   * Check if user can view a profile
   * Rules: Anyone can view any profile (public information)
   */
  static canViewProfile(_user: AuthUser, _targetUserId: string): boolean {
    return true;
  }

  /**
   * Check if user can create a post
   * Rules: Any authenticated user can create posts
   */
  static canCreatePost(_user: AuthUser): boolean {
    return true;
  }

  /**
   * Check if user can create a comment
   * Rules: Any authenticated user can create comments
   */
  static canCreateComment(_user: AuthUser): boolean {
    return true;
  }

  /**
   * Check if user can moderate (admin-only actions)
   * Rules: Only admins
   */
  static canModerate(user: AuthUser): boolean {
    return this.isAdmin(user);
  }
}

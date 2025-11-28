import { db } from '../../db/index.js';
import { refreshTokens } from '../../db/schema/index.js';
import { eq, and, gt } from 'drizzle-orm';

export class RefreshTokenRepository {
  /**
   * Create a new refresh token
   */
  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const [token] = await db
      .insert(refreshTokens)
      .values(data)
      .returning();

    return token;
  }

  /**
   * Find a valid refresh token
   */
  async findValidToken(token: string) {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.isRevoked, false),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return refreshToken || null;
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(token: string) {
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.token, token));
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string) {
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpiredTokens() {
    const result = await db
      .delete(refreshTokens)
      .where(gt(new Date(), refreshTokens.expiresAt));

    return result;
  }

  /**
   * Get all active tokens for a user
   */
  async getUserTokens(userId: string) {
    return db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.isRevoked, false),
          gt(refreshTokens.expiresAt, new Date())
        )
      );
  }
}

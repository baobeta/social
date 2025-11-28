import type { Request, Response, NextFunction } from 'express';
import { verifyToken, generateAccessToken } from '../lib/jwt.ts';
import type { TokenPayload } from '../modules/auth/auth.dto.ts';
import { setAccessTokenCookie } from '../lib/cookie.ts';
import { RefreshTokenRepository } from '../modules/auth/refresh-token.repository.ts';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 * Reads access token from HttpOnly cookie, automatically refreshes if expired
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get access token from cookie
    let accessToken = req.cookies.access_token;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: 'No access token provided',
      });
      return;
    }

    try {
      // Try to verify access token
      const payload = verifyToken(accessToken);
      req.user = payload;
      next();
      return;
    } catch (error) {
      // Access token expired or invalid, try to refresh
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Access token expired and no refresh token available',
        });
        return;
      }

      // Verify refresh token and generate new access token
      const refreshTokenRepo = new RefreshTokenRepository();
      const validRefreshToken = await refreshTokenRepo.findValidToken(refreshToken);

      if (!validRefreshToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
        });
        return;
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: validRefreshToken.userId,
        username: '', // We don't have username in refresh token, but it's not critical
        role: 'user', // Default role, should ideally fetch from database
      });

      // Set new access token cookie
      setAccessTokenCookie(res, newAccessToken);

      // Verify new token and attach to request
      const payload = verifyToken(newAccessToken);
      req.user = payload;

      next();
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}

/**
 * Middleware to check if user has admin role
 * Must be used after authenticate middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't reject if no token
 * Reads from HttpOnly cookie
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies.access_token;
    if (!accessToken) {
      next();
      return;
    }

    const payload = verifyToken(accessToken);
    req.user = payload;

    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
}

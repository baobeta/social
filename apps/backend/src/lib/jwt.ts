import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from './config.ts';
import type { TokenPayload } from '../modules/auth/auth.dto.ts';

/**
 * Generate a short-lived access token (15 minutes)
 * @param payload - Token payload containing user information
 * @returns JWT access token string
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: '30m', // Short-lived access token
  });
}

/**
 * Generate a long-lived refresh token (7 days)
 * Returns a cryptographically secure random string
 * @returns Refresh token string
 */
export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex'); // 128 character hex string
}

/**
 * @deprecated Use generateAccessToken instead
 * Generate a JWT token for a user
 * @param payload - Token payload containing user information
 * @returns JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  return generateAccessToken(payload);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded token payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

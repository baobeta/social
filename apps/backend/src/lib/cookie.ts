import type { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

/**
 * Set access token cookie (15 minutes)
 * HttpOnly, Secure (production), SameSite=Strict
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie('access_token', token, {
    httpOnly: true, // Cannot be accessed by JavaScript - XSS protection
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    path: '/', // Available for all routes
  });
}

/**
 * Set refresh token cookie (7 days)
 * HttpOnly, Secure (production), SameSite=Strict
 * Path restricted to /api/auth for additional security
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth', // Only sent to auth endpoints
  });
}

/**
 * Clear all auth cookies
 * Used during logout
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
  });
}

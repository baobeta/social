import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Strict rate limiting for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 30, // 30 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP + username for more accurate rate limiting
  keyGenerator: (req: Request) => {
    const username = req.body?.username || '';
    return `${req.ip}-${username}`;
  },
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900),
    });
  },
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

/**
 * Standard rate limiting for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiting for password reset endpoints
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again in 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiting for content creation (posts, comments)
 * Prevents spam
 */
export const contentCreationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 posts/comments per minute
  message: {
    success: false,
    error: 'You are creating content too quickly. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    const userId = req.user?.userId || req.ip;
    return `content-${userId}`;
  },
});

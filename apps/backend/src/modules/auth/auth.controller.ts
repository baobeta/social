import type { Request, Response } from 'express';
import { AuthService } from './auth.service.ts';
import { registerSchema, loginSchema } from './auth.dto.ts';
import { logger } from '../../lib/logger.ts';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../../lib/cookie.ts';

export class AuthController {
  private service: AuthService;

  constructor(service: AuthService = new AuthService()) {
    this.service = service;
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      // Register user (pass req for IP and user agent tracking)
      const result = await this.service.register(data, req);

      logger.info({ username: data.username }, 'User registered successfully');

      // Set HttpOnly cookies for access and refresh tokens
      setAccessTokenCookie(res, result.token);
      setRefreshTokenCookie(res, result.refreshToken);

      // Return user info (no tokens in response body for security)
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Registration failed');

      if (error instanceof Error && error.message === 'Username already exists') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  };

  /**
   * Login a user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const data = validationResult.data;

      // Login user (pass req for IP and user agent tracking)
      const result = await this.service.login(data, req);

      logger.info({ username: data.username }, 'User logged in successfully');

      // Set HttpOnly cookies for access and refresh tokens
      setAccessTokenCookie(res, result.token);
      setRefreshTokenCookie(res, result.refreshToken);

      // Return user info (no tokens in response body for security)
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Login failed');

      if (error instanceof Error && error.message === 'Invalid username or password') {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  };

  /**
   * Get current user (requires authentication)
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await this.service.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get current user');

      res.status(500).json({
        success: false,
        error: 'Failed to get user information',
      });
    }
  };

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh
   */
  refresh = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token not found',
        });
        return;
      }

      // Refresh access token
      const result = await this.service.refreshAccessToken(refreshToken);

      // Set new access token cookie
      setAccessTokenCookie(res, result.token);

      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Token refresh failed');

      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }
  };

  /**
   * Logout and revoke refresh token
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refresh_token;

      if (refreshToken) {
        // Revoke refresh token in database
        await this.service.logout(refreshToken);
      }

      // Clear all auth cookies
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Logout failed');

      // Still clear cookies even if revocation fails
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  };
}

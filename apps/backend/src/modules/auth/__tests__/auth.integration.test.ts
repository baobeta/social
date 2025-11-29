import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../auth.routes.ts';
import { db } from '../../../db/index.ts';
import { users, refreshTokens } from '../../../db/schema/index.ts';
import { eq } from 'drizzle-orm';

describe('Authentication API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use(cookieParser()); // Required for HttpOnly cookies
    app.use('/api/auth', authRoutes);

    // Error handler
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await db.delete(users).where(eq(users.username, 'testuser'));
    await db.delete(users).where(eq(users.username, 'anotheruser'));
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(users).where(eq(users.username, 'testuser'));
    await db.delete(users).where(eq(users.username, 'anotheruser'));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
        displayName: 'Tester',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).not.toHaveProperty('token'); // Tokens now in HttpOnly cookies
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');

      // Check that cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('should fail with short username', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'ab',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'short',
        fullName: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid username characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'test user!',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if username already exists', async () => {
      // Register first user
      await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      });

      // Try to register again
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Differentpass1!',
        fullName: 'Another User',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username already exists');
    });

    it('should work without displayName', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.user.displayName).toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Password123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).not.toHaveProperty('token'); // Tokens now in HttpOnly cookies
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Wrongpassword1!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should fail with non-existent username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'Password123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should fail with missing fields', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should set JWT token in HttpOnly cookie', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Password123!',
      });

      // Token should be in HttpOnly cookie, not response body
      expect(response.body.data).not.toHaveProperty('token');

      // Check that Set-Cookie headers are present
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      // Should have both access token and refresh token cookies (with underscores)
      const cookieStrings = cookies as string[];
      const hasAccessToken = cookieStrings.some(c => c.startsWith('access_token='));
      const hasRefreshToken = cookieStrings.some(c => c.startsWith('refresh_token='));
      expect(hasAccessToken).toBe(true);
      expect(hasRefreshToken).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    let cookies: string[];

    beforeEach(async () => {
      // Register to get auth cookies
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      });

      // Extract cookies from response
      cookies = registerResponse.headers['set-cookie'] as string[];
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without cookies', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token in cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'access_token=invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with malformed cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'invalid_cookie_format');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let cookies: string[];

    beforeEach(async () => {
      // Register to get auth cookies
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
      });

      cookies = registerResponse.headers['set-cookie'] as string[];
    });

    it('should logout successfully with valid cookies', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without cookies', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should handle register -> login -> me -> logout flow', async () => {
      // 1. Register
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User',
        displayName: 'Tester',
      });

      expect(registerResponse.status).toBe(201);
      const registerCookies = registerResponse.headers['set-cookie'] as string[];

      // 2. Login (should get new cookies)
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Password123!',
      });

      expect(loginResponse.status).toBe(200);
      const loginCookies = loginResponse.headers['set-cookie'] as string[];

      // 3. Get current user using login cookies
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', loginCookies);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.user.username).toBe('testuser');

      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', loginCookies);

      expect(logoutResponse.status).toBe(200);
    });

    it('should handle multiple users independently', async () => {
      // Register user 1
      const user1Response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'Password123!',
        fullName: 'Test User 1',
      });

      const user1Cookies = user1Response.headers['set-cookie'] as string[];

      // Register user 2
      const user2Response = await request(app).post('/api/auth/register').send({
        username: 'anotheruser',
        password: 'Password456!',
        fullName: 'Test User 2',
      });

      const user2Cookies = user2Response.headers['set-cookie'] as string[];

      // Verify user 1
      const me1Response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user1Cookies);

      expect(me1Response.body.data.user.username).toBe('testuser');

      // Verify user 2
      const me2Response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user2Cookies);

      expect(me2Response.body.data.user.username).toBe('anotheruser');
    });
  });
});

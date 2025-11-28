import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import authRoutes from '../auth.routes.ts';
import { db } from '../../../db/index.ts';
import { users } from '../../../db/schema/index.ts';
import { eq } from 'drizzle-orm';

describe('Authentication API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
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
        password: 'password123',
        fullName: 'Test User',
        displayName: 'Tester',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with short username', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'ab',
        password: 'password123',
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
        password: 'password123',
        fullName: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if username already exists', async () => {
      // Register first user
      await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User',
      });

      // Try to register again
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'differentpassword',
        fullName: 'Another User',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username already exists');
    });

    it('should work without displayName', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
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
        password: 'password123',
        fullName: 'Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should fail with non-existent username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'password123',
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

    it('should return valid JWT token', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123',
      });

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User',
      });

      authToken = registerResponse.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authToken); // Missing "Bearer" prefix

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User',
      });

      authToken = registerResponse.body.data.token;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without authorization', async () => {
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
        password: 'password123',
        fullName: 'Test User',
        displayName: 'Tester',
      });

      expect(registerResponse.status).toBe(201);
      const registerToken = registerResponse.body.data.token;

      // 2. Login
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123',
      });

      expect(loginResponse.status).toBe(200);
      const loginToken = loginResponse.body.data.token;

      // 3. Get current user
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.user.username).toBe('testuser');

      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(logoutResponse.status).toBe(200);
    });

    it('should handle multiple users independently', async () => {
      // Register user 1
      const user1Response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User 1',
      });

      const user1Token = user1Response.body.data.token;

      // Register user 2
      const user2Response = await request(app).post('/api/auth/register').send({
        username: 'anotheruser',
        password: 'password456',
        fullName: 'Test User 2',
      });

      const user2Token = user2Response.body.data.token;

      // Verify user 1
      const me1Response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(me1Response.body.data.user.username).toBe('testuser');

      // Verify user 2
      const me2Response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(me2Response.body.data.user.username).toBe('anotheruser');
    });
  });
});

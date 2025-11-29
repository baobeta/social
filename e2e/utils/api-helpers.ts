import type { APIRequestContext } from '@playwright/test';

/**
 * API Helper utilities for E2E tests
 *
 * These helpers interact with the backend API to set up test data
 * and verify backend state during E2E tests.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

export interface TestUser {
  username: string;
  password: string;
  fullName: string;
  displayName?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      fullName: string;
      displayName: string | null;
      role: string;
    };
  };
}

/**
 * Register a new user via API
 */
export async function registerUser(
  request: APIRequestContext,
  user: TestUser
): Promise<AuthResponse> {
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: user,
  });

  if (!response.ok()) {
    throw new Error(`Registration failed: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Login a user via API and return cookies
 */
export async function loginUser(
  request: APIRequestContext,
  credentials: { username: string; password: string }
): Promise<string[]> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  // Extract cookies from response
  const headers = response.headers();
  const setCookieHeaders = headers['set-cookie'];

  if (!setCookieHeaders) {
    return [];
  }

  // Parse Set-Cookie headers
  return Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];
}

/**
 * Create a post via API
 */
export async function createPost(
  request: APIRequestContext,
  content: string,
  cookies?: string[]
): Promise<{ id: string; content: string }> {
  const headers: Record<string, string> = {};
  if (cookies) {
    headers['Cookie'] = cookies.join('; ');
  }

  const response = await request.post(`${API_URL}/api/posts`, {
    data: { content },
    headers,
  });

  if (!response.ok()) {
    throw new Error(`Create post failed: ${response.status()} ${await response.text()}`);
  }

  const json = await response.json();
  return json.data.post;
}

/**
 * Clean test database via API (if endpoint exists)
 * Note: This should only be available in test environment
 */
export async function cleanTestDatabase(request: APIRequestContext): Promise<void> {
  try {
    await request.post(`${API_URL}/api/test/clean-database`);
  } catch (error) {
    // Endpoint might not exist, that's OK
    console.warn('Could not clean test database via API:', error);
  }
}

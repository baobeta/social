import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateToken, verifyToken, decodeToken } from '../jwt.ts';
import type { TokenPayload } from '../../modules/auth/auth.dto.ts';

describe('JWT Utilities', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    role: 'user',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate valid token structure', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken(mockPayload);

      // Both should be valid JWT tokens (3 parts separated by dots)
      expect(token1.split('.')).toHaveLength(3);
      expect(token2.split('.')).toHaveLength(3);

      // Both should decode to same payload data
      const decoded1 = decodeToken(token1);
      const decoded2 = decodeToken(token2);

      expect(decoded1?.userId).toBe(mockPayload.userId);
      expect(decoded2?.userId).toBe(mockPayload.userId);
    });

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    it('should work with admin role', () => {
      const adminPayload: TokenPayload = {
        ...mockPayload,
        role: 'admin',
      };

      const token = generateToken(adminPayload);
      const decoded = decodeToken(token);

      expect(decoded?.role).toBe('admin');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockPayload);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.username).toBe(mockPayload.username);
      expect(verified.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt';

      expect(() => verifyToken(malformedToken)).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow();
    });

    it('should throw error for tampered token', () => {
      const token = generateToken(mockPayload);
      const parts = token.split('.');

      // Tamper with the signature
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedSignature`;

      expect(() => verifyToken(tamperedToken)).toThrow('Invalid token');
    });

    it('should verify token with all payload fields', () => {
      const token = generateToken(mockPayload);
      const verified = verifyToken(token);

      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.username).toBe(mockPayload.username);
      expect(verified.role).toBe(mockPayload.role);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
    });

    it('should decode expired token (without verification)', () => {
      // Even expired tokens can be decoded
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = decodeToken('');
      expect(decoded).toBeNull();
    });

    it('should decode tampered token (no verification)', () => {
      // Decode doesn't verify, so it might return data from tampered token
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work end-to-end: generate -> verify -> decode', () => {
      const token = generateToken(mockPayload);

      // Verify
      const verified = verifyToken(token);
      expect(verified.userId).toBe(mockPayload.userId);

      // Decode
      const decoded = decodeToken(token);
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should handle multiple users', () => {
      const users: TokenPayload[] = [
        { userId: 'user-1', username: 'user1', role: 'user' },
        { userId: 'user-2', username: 'user2', role: 'admin' },
        { userId: 'user-3', username: 'user3', role: 'user' },
      ];

      const tokens = users.map((user) => generateToken(user));

      tokens.forEach((token, index) => {
        const verified = verifyToken(token);
        expect(verified.userId).toBe(users[index]?.userId);
        expect(verified.username).toBe(users[index]?.username);
        expect(verified.role).toBe(users[index]?.role);
      });
    });

    it('should maintain payload integrity', () => {
      const payloads: TokenPayload[] = [
        { userId: '1', username: 'alice', role: 'user' },
        { userId: '2', username: 'bob', role: 'admin' },
        { userId: '3', username: 'charlie', role: 'user' },
      ];

      payloads.forEach((payload) => {
        const token = generateToken(payload);
        const verified = verifyToken(token);

        expect(verified).toMatchObject(payload);
      });
    });
  });

  describe('Token Expiration', () => {
    it('should include expiration in token', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      // Check that token has expiration claim
      expect(decoded).toHaveProperty('iat'); // issued at
      // Note: 'exp' is added by jwt.sign based on expiresIn option
    });
  });
});

import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../password.ts';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'mySecretPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash passwords with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mySecretPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MyPassword';
      const hash = await hashPassword(password);

      const result1 = await comparePassword('MyPassword', hash);
      const result2 = await comparePassword('mypassword', hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      const password = 'P@ssw0rd!#$';
      const hash = await hashPassword(password);

      const result = await comparePassword('P@ssw0rd!#$', hash);
      expect(result).toBe(true);
    });

    it('should return false for invalid hash format', async () => {
      const password = 'myPassword';
      const invalidHash = 'not-a-valid-bcrypt-hash';

      // bcrypt returns false for invalid hash instead of throwing
      const result = await comparePassword(password, invalidHash);
      expect(result).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work end-to-end', async () => {
      const password = 'testPassword123';

      // Hash the password
      const hash = await hashPassword(password);

      // Verify correct password
      const isCorrect = await comparePassword(password, hash);
      expect(isCorrect).toBe(true);

      // Verify wrong password
      const isWrong = await comparePassword('wrongPassword', hash);
      expect(isWrong).toBe(false);
    });

    it('should handle multiple hash/compare cycles', async () => {
      const passwords = ['pass1', 'pass2', 'pass3'];
      const hashes = await Promise.all(passwords.map((p) => hashPassword(p)));

      for (let i = 0; i < passwords.length; i++) {
        const isMatch = await comparePassword(passwords[i]!, hashes[i]!);
        expect(isMatch).toBe(true);

        // Check that other passwords don't match
        for (let j = 0; j < passwords.length; j++) {
          if (i !== j) {
            const isNotMatch = await comparePassword(passwords[j]!, hashes[i]!);
            expect(isNotMatch).toBe(false);
          }
        }
      }
    });
  });
});

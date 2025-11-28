import { describe, it, expect } from 'vitest';
import { generateInitials } from '../initials.js';

describe('generateInitials', () => {
  describe('Basic functionality', () => {
    it('should generate initials from two-word name', () => {
      expect(generateInitials('John Doe')).toBe('JD');
    });

    it('should generate initials from three-word name', () => {
      expect(generateInitials('John Middle Doe')).toBe('JD');
    });

    it('should generate initial from single word', () => {
      expect(generateInitials('John')).toBe('J');
    });

    it('should handle names with multiple spaces', () => {
      expect(generateInitials('  John   Doe  ')).toBe('JD');
    });

    it('should return empty string for empty input', () => {
      expect(generateInitials('')).toBe('');
    });

    it('should return empty string for whitespace only', () => {
      expect(generateInitials('   ')).toBe('');
    });

    it('should always return uppercase', () => {
      expect(generateInitials('john doe')).toBe('JD');
    });
  });

  describe('Special character handling', () => {
    it('should skip leading special characters', () => {
      expect(generateInitials('@John #Doe')).toBe('JD');
    });

    it('should skip numbers-only words', () => {
      // "123" is filtered out completely, leaving "John Doe"
      expect(generateInitials('123 John Doe')).toBe('JD');
    });

    it('should handle names with special characters in the middle', () => {
      expect(generateInitials("O'Brien Smith")).toBe('OS');
    });

    it('should handle names with hyphens', () => {
      expect(generateInitials('Mary-Jane Watson')).toBe('MW');
    });

    it('should handle names with dots', () => {
      // "Dr." has alphabetic chars, so first word is "Dr." (D), last word is "Doe" (D)
      expect(generateInitials('Dr. John Doe')).toBe('DD');
    });

    it('should return empty string for names with no alphabetic characters', () => {
      expect(generateInitials('123 456')).toBe('');
    });

    it('should handle single word with leading special characters', () => {
      expect(generateInitials('@John')).toBe('J');
    });

    it('should handle mixed special characters and letters', () => {
      expect(generateInitials('!@#John $%^Doe')).toBe('JD');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long names', () => {
      expect(generateInitials('Alexander Benjamin Christopher Davidson')).toBe('AD');
    });

    it('should handle single character names', () => {
      expect(generateInitials('A B')).toBe('AB');
    });

    it('should handle unicode characters', () => {
      // Unicode letters should still work
      expect(generateInitials('José García')).toBe('JG');
    });

    it('should handle names with emojis', () => {
      expect(generateInitials('😀John 🎉Doe')).toBe('JD');
    });
  });

  describe('Invalid input', () => {
    it('should handle null as empty string', () => {
      expect(generateInitials(null as any)).toBe('');
    });

    it('should handle undefined as empty string', () => {
      expect(generateInitials(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(generateInitials(123 as any)).toBe('');
    });
  });
});

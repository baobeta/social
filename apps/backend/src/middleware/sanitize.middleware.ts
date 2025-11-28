import type { Request, Response, NextFunction } from 'express';
import { filterXSS } from 'xss';
import validator from 'validator';

/**
 * Sanitize user input to prevent XSS and injection attacks
 * Implements OWASP input validation best practices
 * Uses industry-standard packages: xss and validator
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string input
 * Removes dangerous characters that could lead to XSS
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Limit length (prevent DoS)
    .slice(0, 10000);
}

/**
 * Strip HTML tags from user input using the xss package
 * Use for fields that should only contain plain text
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return str;

  // Strip all HTML by using an empty whitelist
  return filterXSS(str, {
    whiteList: {}, // Empty whitelist = strip all tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

/**
 * Escape HTML entities using validator.js
 * Use before displaying user-generated content
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return str;

  // Use validator.js escape function
  return validator.escape(str);
}

/**
 * Validate and sanitize username using validator package
 */
export function sanitizeUsername(username: string): string {
  if (typeof username !== 'string') {
    throw new Error('Username must be a string');
  }

  // Trim and normalize whitespace
  let sanitized = validator.trim(username);
  sanitized = validator.stripLow(sanitized); // Remove control characters

  // Only allow alphanumeric and underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');

  // Validate length
  if (!validator.isLength(sanitized, { min: 3, max: 50 })) {
    throw new Error('Username must be between 3 and 50 characters');
  }

  // Validate alphanumeric
  if (!validator.isAlphanumeric(sanitized, 'en-US', { ignore: '_' })) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }

  return sanitized;
}

/**
 * Prevent NoSQL injection
 */
export function preventNoSQLInjection(req: Request, res: Response, next: NextFunction) {
  const checkForInjection = (obj: any): boolean => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        // Check for MongoDB operators
        if (key.startsWith('$') || key.includes('.')) {
          return true;
        }
        if (checkForInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    res.status(400).json({
      success: false,
      error: 'Invalid input detected',
    });
    return;
  }

  next();
}

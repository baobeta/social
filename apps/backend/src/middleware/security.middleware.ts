import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Enhanced security headers middleware
 * Implements OWASP security best practices
 */
export function securityHeaders() {
  return helmet({
    // Content Security Policy - Prevents XSS attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on your needs
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Strict Transport Security - Forces HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevents clickjacking attacks
    frameguard: {
      action: 'deny',
    },
    // Prevents MIME type sniffing
    noSniff: true,
    // Disables X-Powered-By header
    hidePoweredBy: true,
    // Prevents browsers from performing DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },
    // Prevents IE from executing downloads in site's context
    ieNoOpen: true,
    // Forces XSS filter in older browsers
    xssFilter: true,
  });
}

/**
 * Custom security headers
 */
export function customSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Request ID middleware for tracking and logging
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

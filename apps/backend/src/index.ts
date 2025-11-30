import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { getRedisClient, closeRedis } from './lib/redis.js';
import { errorHandler } from './middleware/error-handler.js';
import { securityHeaders, customSecurityHeaders, requestId } from './middleware/security.middleware.js';
import { authRateLimit, apiRateLimit } from './middleware/rate-limit.middleware.js';
import { sanitizeInput, preventNoSQLInjection } from './middleware/sanitize.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import postRoutes from './modules/post/post.routes.js';
import commentRoutes from './modules/comment/comment.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// Initialize Redis connection
getRedisClient();

// Request tracking - add unique ID to each request
app.use(requestId);

// Enhanced security headers with comprehensive CSP, HSTS, etc.
app.use(securityHeaders());
app.use(customSecurityHeaders);

// Cookie parser - MUST be before routes that use cookies
app.use(cookieParser());

// CORS configuration with credentials support for HttpOnly cookies
logger.info({ allowedOrigins: config.cors.origin }, 'CORS configuration');
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info({
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
    },
    ip: req.ip,
  }, 'Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    }, 'Request completed');
  });

  next();
});

// Security middleware - must be before routes
app.use(preventNoSQLInjection); // Prevent NoSQL injection attacks
app.use(sanitizeInput); // Sanitize all user input

// Health check endpoint (no rate limit)
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with rate limiting
// Auth routes - strict rate limiting to prevent brute force attacks
app.use('/api/auth', authRateLimit, authRoutes);

// User routes - standard rate limiting
app.use('/api/users', apiRateLimit, userRoutes);

// Search routes - standard rate limiting
app.use('/api/search', apiRateLimit, searchRoutes);

// Post routes - content creation rate limiting to prevent spam
app.use('/api/posts', apiRateLimit, postRoutes);

// Comment routes - content creation rate limiting to prevent spam
app.use('/api', apiRateLimit, commentRoutes); // Comment routes include both /posts/:postId/comments and /comments/:id

// Audit log routes - admin access only
app.use('/api/audit-logs', apiRateLimit, auditRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  logger.info(`Server running on http://${config.host}:${config.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Close Redis connection
  await closeRedis();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

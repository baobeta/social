import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  logger.info(`Server running on http://${config.host}:${config.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
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

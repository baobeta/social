import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file if it exists (for development)
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'e2e']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),
  TEST_DATABASE_URL: z.string().optional(),
  E2E_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

const env = parseEnv();

// Determine which database to use based on environment
function getDatabaseUrl(): string {
  if (env.NODE_ENV === 'test' && env.TEST_DATABASE_URL) {
    return env.TEST_DATABASE_URL;
  }
  if (env.NODE_ENV === 'e2e' && env.E2E_DATABASE_URL) {
    return env.E2E_DATABASE_URL;
  }
  return env.DATABASE_URL;
}

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  host: env.HOST,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  isE2E: env.NODE_ENV === 'e2e',
  database: {
    url: getDatabaseUrl(),
  },
  redis: {
    url: env.REDIS_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
} as const;

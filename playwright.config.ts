import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * This configuration sets up end-to-end testing for the social media application.
 * Tests run against both frontend and backend services.
 *
 * Environment Variables:
 * - BASE_URL: Frontend URL (default: http://localhost:5173)
 * - API_URL: Backend API URL (default: http://localhost:3000)
 */

export default defineConfig({
  testDir: './e2e',

  // Global setup and teardown
  globalSetup: require.resolve('./e2e/setup/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/setup/global-teardown.ts'),

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for frontend
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment to test on Safari
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Uncomment to test on mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Run local dev server before starting tests
  webServer: [
    {
      // Backend server with E2E test environment
      // NODE_ENV=e2e triggers the backend to use E2E_DATABASE_URL from .env
      command: 'NODE_ENV=e2e npm run dev:backend',
      url: 'http://localhost:3000/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      // Set to 'pipe' to see server logs during test runs
      stdout: process.env.DEBUG ? 'pipe' : 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:frontend',
      url: 'http://localhost:5173',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      // Set to 'pipe' to see server logs during test runs
      stdout: process.env.DEBUG ? 'pipe' : 'ignore',
      stderr: 'pipe',
    },
  ],
});

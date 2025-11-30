# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the social media application using Playwright.

## 📁 Directory Structure

```
e2e/
├── fixtures/           # Custom test fixtures and helpers
│   └── test-fixture.ts # Authenticated user fixtures
├── utils/              # Utility functions for tests
│   └── api-helpers.ts  # API interaction helpers
├── auth.spec.ts        # Authentication tests
├── posts.spec.ts       # Post management tests
├── comments.spec.ts    # Comment functionality tests
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Install Playwright browsers** (if not already installed):
   ```bash
   npx playwright install chromium
   ```

3. **Set up E2E test database** (IMPORTANT!):
   ```bash
   npm run test:e2e:setup
   ```

   This creates a **separate database** for E2E tests to protect your development data!

   See [E2E_DATABASE_SETUP.md](./E2E_DATABASE_SETUP.md) for full details.

### Running Tests

#### Run all E2E tests (headless mode)
```bash
npm run test:e2e
```

**Note**: Playwright will automatically start both backend and frontend servers before running tests. If servers are already running, it will reuse them.

#### Run tests with server logs (for debugging server issues)
```bash
DEBUG=1 npm run test:e2e
```

#### Run tests with UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

#### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

#### Run tests in debug mode
```bash
npm run test:e2e:debug
```

#### View test report
```bash
npm run test:e2e:report
```

#### Run specific test file
```bash
npx playwright test auth.spec.ts
```

#### Run tests matching a pattern
```bash
npx playwright test --grep "should login"
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Interact with elements
    await page.click('button');
    await page.fill('input', 'value');

    // Assert expectations
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Using Authenticated Fixtures

For tests that require a logged-in user:

```typescript
import { test, expect } from './fixtures/test-fixture';

test('should create a post', async ({ authenticatedPage: page, testUser }) => {
  // Page is already logged in with testUser
  await page.goto('/');

  // Test user info is available
  console.log(testUser.username);
});
```

### Using API Helpers

For test data setup:

```typescript
import { test, expect } from './fixtures/test-fixture';
import { createPost } from './utils/api-helpers';

test('should view posts', async ({ authenticatedPage: page, request }) => {
  // Get cookies for API authentication
  const cookies = await page.context().cookies();
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Create test data via API
  await createPost(request, 'Test post content', [cookieString]);

  // Test the UI
  await page.goto('/');
  await expect(page.locator('text=Test post content')).toBeVisible();
});
```

## 🎯 Test Categories

### Authentication Tests (`auth.spec.ts`)
- User registration
- User login
- User logout
- Form validation
- Protected routes

### Post Tests (`posts.spec.ts`)
- Creating posts
- Viewing timeline
- Editing posts
- Deleting posts
- Searching posts

### Comment Tests (`comments.spec.ts`)
- Adding comments
- Replying to comments
- Editing comments
- Deleting comments
- Nested comment display

## 🔧 Configuration

The Playwright configuration is defined in `/playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:5173` (frontend)
- **API URL**: `http://localhost:3000` (backend)
- **Test timeout**: 30 seconds
- **Retries**: 2 retries in CI, 0 locally
- **Parallel execution**: Enabled
- **Browsers**: Chromium (Firefox and Safari available but commented out)

### Automatic Server Startup

The configuration automatically starts both backend and frontend servers before running tests:

```typescript
webServer: [
  {
    command: 'cd apps/backend && npm run dev',
    url: 'http://localhost:3000/health',
  },
  {
    command: 'cd apps/frontend && npm run dev',
    url: 'http://localhost:5173',
  },
]
```

## 📊 Test Reports

After running tests, reports are generated in:
- **HTML Report**: `playwright-report/` - View with `npm run test:e2e:report`
- **Test Results**: `test-results/` - Contains screenshots and videos of failures

## 🐛 Debugging Tests

### Using Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect element locators
- View console logs
- See network requests

### Using UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

UI Mode provides:
- Visual test execution
- Time travel debugging
- Watch mode
- Element picker

### Taking Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Console Logging

```typescript
page.on('console', msg => console.log('Browser console:', msg.text()));
```

## 🎭 Best Practices

### 1. Use Data Test IDs

Add `data-testid` attributes to important elements:

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

### 2. Isolate Tests

Each test should be independent:
- Don't rely on test execution order
- Clean up data after tests (or use fixtures)
- Use unique identifiers for test data

### 3. Use Explicit Waits

```typescript
// Good - wait for specific condition
await page.waitForSelector('text=Success');
await expect(page.locator('text=Success')).toBeVisible();

// Avoid - arbitrary timeouts
await page.waitForTimeout(3000);
```

### 4. Use API for Test Setup

Use API helpers to set up test data quickly:

```typescript
// Faster and more reliable
await createPost(request, 'Test post', cookies);

// Slower - uses UI
await page.fill('textarea', 'Test post');
await page.click('button:has-text("Post")');
```

### 5. Handle Flaky Tests

- Use auto-waiting features
- Add explicit waits for network calls
- Check for element visibility before interaction
- Use retry logic in CI

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🤝 Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Add tests to appropriate spec files
3. Use fixtures and helpers for common operations
4. Document complex test scenarios
5. Ensure tests pass locally before committing

## 🔍 Common Issues

### Tests fail with "server not ready"
**Solution**:
1. Check if ports 3000 and 5173 are available
2. Manually start servers: `npm run dev:backend` and `npm run dev:frontend`
3. Verify health endpoint works: `curl http://localhost:3000/health`
4. Check server logs: `DEBUG=1 npm run test:e2e`
5. Increase timeout in `playwright.config.ts` if needed

### Tests are flaky
**Solution**: Add explicit waits, use `toBeVisible()` instead of checking existence

### Cannot find element
**Solution**: Use Playwright Inspector to find correct selector:
```bash
npx playwright test --debug
```

### Database state issues
**Solution**: Ensure test database is cleaned between test runs

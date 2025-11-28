# Import Guide - Quick Reference

## Rule: Use .ts Extensions for All Local Imports

```typescript
// ✅ CORRECT - Use .ts for local files
import { users } from './schema.ts';
import { config } from '../lib/config.ts';
import { logger } from '../../lib/logger.ts';

// ✅ CORRECT - No extension for npm packages
import express from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';

// ❌ WRONG - Don't use .js or no extension
import { users } from './schema.js';
import { users } from './schema';
```

## How It Works

- **Development (`npm run dev`)**: tsx handles `.ts` imports
- **Production (`npm run build`)**: esbuild bundles `.ts` imports
- **Runtime (`npm start`)**: Node.js runs bundled JavaScript

## Commands

```bash
# Development with .ts imports
npm run dev

# Build (resolves .ts to bundled JS)
npm run build

# Production (runs compiled code)
npm start
```

See [docs/TS_EXTENSIONS_DUAL_MODE.md](../../docs/TS_EXTENSIONS_DUAL_MODE.md) for details.

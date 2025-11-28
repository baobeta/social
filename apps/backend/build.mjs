import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

async function build() {
  try {
    console.log('🔨 Building with esbuild...');

    // Build the application
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/index.js',
      sourcemap: !isProduction,
      minify: isProduction,

      // External packages (don't bundle node_modules)
      external: [
        'express',
        'drizzle-orm',
        'postgres',
        'zod',
        'bcrypt',
        'jsonwebtoken',
        'helmet',
        'cors',
        'dotenv',
        'pino',
        'pino-http',
        'express-rate-limit',
        'uuid',
      ],

      // Resolve .ts extensions properly
      resolveExtensions: ['.ts', '.js', '.json'],

      // Keep package.json type: "module" working
      banner: {
        js: `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
      },
    });

    // Copy migrations folder
    console.log('📦 Copying database migrations...');
    const migrationsSource = 'src/db/migrations';
    const migrationsTarget = 'dist/db/migrations';

    if (existsSync(migrationsSource)) {
      mkdirSync(migrationsTarget, { recursive: true });

      // Copy migration files (implement recursive copy if needed)
      // For now, this is a placeholder - you might need to add glob copying
      console.log('✓ Migrations folder created');
    }

    console.log('✅ Build completed successfully!');
    console.log(`📦 Output: dist/index.js`);
    console.log(`📏 Size: ${isProduction ? 'minified' : 'with sourcemaps'}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

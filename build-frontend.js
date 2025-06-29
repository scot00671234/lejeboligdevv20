#!/usr/bin/env node
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure output directory exists
const outDir = join(__dirname, 'dist/public');
mkdirSync(outDir, { recursive: true });

// Build CSS first
console.log('Building CSS...');
try {
  const { execSync } = await import('child_process');
  execSync('cd client && npx tailwindcss -i src/index.css -o ../dist/public/index.css --minify', { 
    stdio: 'inherit',
    timeout: 30000 
  });
  console.log('✓ CSS built successfully');
} catch (error) {
  console.error('CSS build failed:', error);
  process.exit(1);
}

// Build JavaScript with esbuild (bypasses Vite/Lucide issues)
console.log('Building JavaScript...');
try {
  await build({
    entryPoints: ['client/src/main.tsx'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    outfile: join(outDir, 'index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.MODE': '"production"',
    },
    jsx: 'automatic',
    jsxDev: false,
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
    alias: {
      '@': join(__dirname, 'client/src'),
      '@shared': join(__dirname, 'shared'),
    },
    external: [],
    splitting: false,
    metafile: false,
    logLevel: 'warning',
  });
  console.log('✓ JavaScript built successfully');
} catch (error) {
  console.error('JavaScript build failed:', error);
  process.exit(1);
}

// Create production HTML
console.log('Creating production HTML...');
const htmlContent = `<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lejebolig Nu - Find Your Perfect Rental in Denmark</title>
    <meta name="description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home with Lejebolig Nu - Denmark's premier rental platform." />
    <meta name="keywords" content="lejebolig, rental, Denmark, apartments, houses, landlord, tenant" />
    <meta name="author" content="Lejebolig Nu" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Lejebolig Nu - Find Your Perfect Rental in Denmark" />
    <meta property="og:description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home." />
    <meta property="og:image" content="/og-image.jpg" />
    <meta property="og:url" content="https://lejebolig.nu" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Lejebolig Nu - Find Your Perfect Rental in Denmark" />
    <meta name="twitter:description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home." />
    <meta name="twitter:image" content="/og-image.jpg" />
    
    <!-- Security -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" />
    
    <!-- Production Assets -->
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;

writeFileSync(join(outDir, 'index.html'), htmlContent);
console.log('✓ Production HTML created');

console.log(`Frontend build completed successfully!`);
console.log(`Output directory: ${outDir}`);

// Verify critical files exist
const criticalFiles = ['index.html', 'index.css', 'index.js'];
for (const file of criticalFiles) {
  const filePath = join(outDir, file);
  if (!existsSync(filePath)) {
    console.error(`❌ Critical file missing: ${filePath}`);
    process.exit(1);
  }
}

console.log('✓ All critical files verified');
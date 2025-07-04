import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

// Custom build script for production to avoid Vite timeout issues
async function buildFrontend() {
  try {
    console.log('Building frontend with esbuild...');
    
    // Create dist directory
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    if (!fs.existsSync('dist/public')) {
      fs.mkdirSync('dist/public', { recursive: true });
    }

    // Build the frontend
    await build({
      entryPoints: ['client/src/main.tsx'],
      bundle: true,
      minify: true,
      sourcemap: false,
      outfile: 'dist/public/assets/index.js',
      format: 'esm',
      target: 'es2020',
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
      external: [], // Bundle everything
      splitting: false, // Avoid splitting to reduce complexity
      write: true,
      platform: 'browser',
    });

    // Build CSS separately
    await build({
      entryPoints: ['client/src/index.css'],
      bundle: true,
      minify: true,
      outfile: 'dist/public/assets/index.css',
      loader: {
        '.css': 'css',
      },
    });

    // Copy HTML template
    const htmlTemplate = `<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lejebolig Find - Find Your Perfect Rental in Denmark</title>
    <meta name="description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home with Lejebolig Find - Denmark's premier rental platform." />
    <meta name="keywords" content="lejebolig, rental, Denmark, apartments, houses, landlord, tenant" />
    <meta name="author" content="Lejebolig Find" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Lejebolig Find - Find Your Perfect Rental in Denmark" />
    <meta property="og:description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home." />
    <meta property="og:url" content="https://lejeboligfind.dk" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Lejebolig Find - Find Your Perfect Rental in Denmark" />
    <meta name="twitter:description" content="Discover rental properties across Denmark. Connect with landlords and find your ideal home." />
    
    <!-- Security -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" />
    
    <link rel="stylesheet" href="./assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/index.js"></script>
  </body>
</html>`;

    fs.writeFileSync('dist/public/index.html', htmlTemplate);
    
    console.log('Frontend build completed successfully!');
    console.log('Files generated:');
    console.log('- dist/public/index.html');
    console.log('- dist/public/assets/index.js');
    console.log('- dist/public/assets/index.css');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildFrontend();
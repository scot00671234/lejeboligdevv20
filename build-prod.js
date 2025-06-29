import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Simple production build script that avoids Vite's Lucide React bundling issues
async function buildProduction() {
  console.log('Building production assets...');
  
  try {
    // Build the React app with esbuild (faster than Vite for this case)
    await build({
      entryPoints: ['client/src/main.tsx'],
      bundle: true,
      minify: true,
      format: 'esm',
      target: ['es2020'],
      outfile: 'dist/public/assets/index.js',
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
      },
      jsx: 'automatic',
      jsxDev: false,
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
      alias: {
        '@': './client/src',
        '@shared': './shared',
      },
      external: [],
      splitting: false,
      metafile: true,
    });
    
    console.log('✓ JavaScript bundle created');
    
    // Build the server
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      packages: 'external',
      format: 'esm',
      outfile: 'dist/index.js',
      target: ['node18'],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    
    console.log('✓ Server bundle created');
    console.log('Production build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProduction();
import { execSync } from 'child_process';
import fs from 'fs';

// Production build script that bypasses Vite timeout issues
async function buildProduction() {
  try {
    console.log('Starting production build...');
    
    // Step 1: Build frontend using our reliable script
    console.log('Building frontend...');
    execSync('node build-frontend.js', { stdio: 'inherit' });
    
    // Step 2: Build backend server
    console.log('Building backend server...');
    execSync('npx esbuild server/prod.ts --platform=node --packages=external --bundle --format=esm --outfile=server-prod.js', { stdio: 'inherit' });
    
    // Step 3: Verify all files exist
    const requiredFiles = [
      'dist/public/index.html',
      'dist/public/assets/index.js',
      'dist/public/assets/index.css',
      'server-prod.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    console.log('Production build completed successfully!');
    console.log('Generated files:');
    requiredFiles.forEach(file => {
      const stats = fs.statSync(file);
      console.log(`- ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
    
  } catch (error) {
    console.error('Production build failed:', error);
    process.exit(1);
  }
}

buildProduction();
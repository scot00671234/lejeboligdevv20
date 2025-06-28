#!/usr/bin/env node

// Production readiness test suite
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const tests = [
  {
    name: 'Environment Variables Check',
    test: async () => {
      const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
      const missing = requiredEnvVars.filter(env => !process.env[env]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      // Check JWT_SECRET length
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
      
      return 'All required environment variables are set';
    }
  },
  
  {
    name: 'Build Process',
    test: async () => {
      try {
        await execAsync('npm run build');
        
        // Check if build files exist
        const distExists = fs.existsSync('dist');
        const indexExists = fs.existsSync('dist/index.js');
        const publicExists = fs.existsSync('dist/public');
        
        if (!distExists || !indexExists || !publicExists) {
          throw new Error('Build output files missing');
        }
        
        return 'Build completed successfully';
      } catch (error) {
        throw new Error(`Build failed: ${error.message}`);
      }
    }
  },
  
  {
    name: 'TypeScript Compilation',
    test: async () => {
      try {
        await execAsync('npm run check');
        return 'TypeScript compilation successful';
      } catch (error) {
        throw new Error(`TypeScript errors: ${error.message}`);
      }
    }
  },
  
  {
    name: 'Database Schema',
    test: async () => {
      try {
        await execAsync('npm run db:push');
        return 'Database schema deployed successfully';
      } catch (error) {
        throw new Error(`Database schema deployment failed: ${error.message}`);
      }
    }
  },
  
  {
    name: 'Security Headers',
    test: async () => {
      const indexFile = fs.readFileSync('server/index.ts', 'utf8');
      
      const securityChecks = [
        'helmet',
        'cors',
        'rateLimit'
      ];
      
      const missing = securityChecks.filter(check => !indexFile.includes(check));
      
      if (missing.length > 0) {
        throw new Error(`Missing security middleware: ${missing.join(', ')}`);
      }
      
      return 'Security middleware configured';
    }
  },
  
  {
    name: 'Production Configuration',
    test: async () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts.start) {
        throw new Error('Missing start script in package.json');
      }
      
      if (!packageJson.scripts.build) {
        throw new Error('Missing build script in package.json');
      }
      
      // Check for production dependencies
      const requiredDeps = ['express', 'drizzle-orm', 'bcrypt', 'jsonwebtoken'];
      const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
      
      if (missing.length > 0) {
        throw new Error(`Missing production dependencies: ${missing.join(', ')}`);
      }
      
      return 'Production configuration valid';
    }
  },
  
  {
    name: 'Docker Configuration',
    test: async () => {
      const dockerfileExists = fs.existsSync('Dockerfile');
      const dockerIgnoreExists = fs.existsSync('.dockerignore');
      const composeExists = fs.existsSync('docker-compose.yml');
      
      if (!dockerfileExists) {
        throw new Error('Dockerfile missing');
      }
      
      if (!dockerIgnoreExists) {
        throw new Error('.dockerignore missing');
      }
      
      if (!composeExists) {
        throw new Error('docker-compose.yml missing');
      }
      
      return 'Docker configuration complete';
    }
  }
];

async function runTests() {
  console.log('🚀 Running production readiness tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`✅ ${test.name}: ${result}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Project is production ready.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please fix the issues before deploying.');
    process.exit(1);
  }
}

runTests().catch(console.error);
#!/usr/bin/env node

import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set development environment
process.env.NODE_ENV = 'development';

console.log('🚀 Starting full-stack development server...');

// Start the Express server which will handle both API and frontend via Vite middleware
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  },
  cwd: __dirname
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle server exit
server.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});
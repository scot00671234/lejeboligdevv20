#!/usr/bin/env node

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

// Set development environment
process.env.NODE_ENV = 'development';

console.log('Starting development server...');

// Start the server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});
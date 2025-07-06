#!/usr/bin/env node
import dotenv from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables from .env file
dotenv.config();

// Set environment variables for development
process.env.NODE_ENV = 'development';

// Start the server with tsx
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
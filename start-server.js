#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Set development environment
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '5000';

// Import and run the server
import './server/index.js';
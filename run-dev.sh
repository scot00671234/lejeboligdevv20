#!/bin/bash

# Load environment variables
export NODE_ENV=development
export PORT=5000

# Start the Express server which handles both API and frontend
echo "Starting development server..."
npx tsx server/index.ts
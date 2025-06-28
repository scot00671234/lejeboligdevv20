#!/bin/bash

# Production deployment script for Ubuntu VPS with Coolify
set -e

echo "🚀 Starting production deployment for Lejebolig Nu..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is required"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET is required"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations if needed
echo "🗃️ Pushing database schema..."
npm run db:push

# Start the application
echo "✅ Starting production server..."
exec npm start
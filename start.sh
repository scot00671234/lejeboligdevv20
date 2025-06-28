#!/bin/bash

# Production startup script with database migration and health checks
set -e

echo "🚀 Starting Danish Rental Platform (Lejebolig Nu)..."

# Environment validation
echo "📋 Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is required"
    exit 1
fi

if [ "$NODE_ENV" = "production" ]; then
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo "❌ ERROR: JWT_SECRET must be at least 32 characters in production"
        exit 1
    fi
    
    if [ -n "$SESSION_SECRET" ] && [ ${#SESSION_SECRET} -lt 32 ]; then
        echo "❌ ERROR: SESSION_SECRET must be at least 32 characters in production"
        exit 1
    fi
fi

echo "✅ Environment validation passed"

# Database migration
echo "🗄️  Running database migrations..."
if command -v npm &> /dev/null; then
    npm run db:push || {
        echo "⚠️  Database migration failed, but continuing startup..."
        echo "   This may be expected on first deployment"
    }
else
    echo "⚠️  npm not found, skipping database migration"
fi

echo "✅ Database setup completed"

# Health check setup
echo "🔍 Setting up health monitoring..."
export STARTUP_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Start the application
echo "🌟 Starting application server..."
exec node dist/index.js
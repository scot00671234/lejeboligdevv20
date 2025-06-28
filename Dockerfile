# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Install system dependencies including curl for health checks
RUN apk add --no-cache curl

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with increased timeout and retry logic
RUN npm ci --omit=dev --timeout=600000 && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --timeout=600000

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV CI=true

# Build with timeout and better error handling - use production server
RUN timeout 1200 sh -c "vite build && esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist" || (echo "Build failed, checking for partial build..." && ls -la dist/ && exit 1)

# Production image
FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application directly
CMD ["node", "dist/index.js"]
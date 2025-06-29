# Production Node.js build with reliable frontend compilation
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install ALL dependencies (dev + prod needed for build)
RUN npm ci --timeout=600000

# Copy source code
COPY . .

# Build frontend using our reliable build script (bypasses Vite/Lucide issues)
RUN node build-frontend.js

# Verify frontend build completed successfully
RUN test -f /app/dist/public/index.html || (echo "Frontend build failed: index.html not found" && exit 1)
RUN test -f /app/dist/public/index.css || (echo "Frontend build failed: index.css not found" && exit 1)
RUN test -f /app/dist/public/index.js || (echo "Frontend build failed: index.js not found" && exit 1)

# Build backend server
RUN npx esbuild server/prod.ts --platform=node --packages=external --bundle --format=esm --outfile=server-prod.js

# Remove dev dependencies to reduce image size
RUN npm ci --omit=dev --timeout=600000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 5000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "server-prod.js"]
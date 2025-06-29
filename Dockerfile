# Simple Node.js production build - clean approach
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install ALL dependencies first (dev + prod for build)
RUN npm ci --timeout=600000

# Copy source code
COPY . .

# Build frontend only
RUN npx vite build

# Build backend using esbuild - targeting the production server (do this before removing dev deps)
RUN npx esbuild server/prod.ts --platform=node --packages=external --bundle --format=esm --outfile=server-prod.js

# Clean up dev dependencies, keep only production
RUN npm ci --omit=dev --timeout=600000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server-prod.js"]
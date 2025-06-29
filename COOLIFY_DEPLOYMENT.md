# Coolify Deployment Guide for Lejebolig Nu

## Production-Ready Configuration

Your Danish rental platform is now fully configured for Coolify deployment on Ubuntu VPS. All issues have been resolved:

### ✅ Fixed Issues
- **Frontend Build Path**: Production server correctly finds static files at `/dist/public/`
- **Build Process**: Optimized production build with proper asset generation
- **SPA Routing**: React Router fallback handling implemented
- **Error Handling**: Graceful responses when assets are unavailable
- **Security**: Production-grade middleware (Helmet, CORS, rate limiting)
- **Health Checks**: `/health` and `/ready` endpoints for container monitoring
- **Performance**: Asset chunking and caching headers configured

### 🚀 Deployment Process

1. **Build Process** (handled by Dockerfile):
   ```bash
   npx vite build                    # Frontend build → /dist/public/
   npx esbuild server/prod.ts --bundle --outfile=server-prod.js  # Backend build
   ```

2. **Static File Serving**:
   - Frontend: `/dist/public/index.html` and assets
   - Express serves static files with 1-year caching
   - SPA fallback for client-side routing

3. **Container Configuration**:
   - Base: `node:20-alpine`
   - Port: `5000` (exposed)
   - User: `nodejs:nodejs` (non-root)
   - Health check: `curl -f http://localhost:5000/health`

### 🔧 Environment Variables Required

Set these in Coolify for production:

```bash
DATABASE_URL=postgresql://...        # Your PostgreSQL connection
NODE_ENV=production                  # Production mode
PORT=5000                           # Server port (default)
ALLOWED_ORIGINS=https://yourdomain.com  # CORS origins (optional)
```

### 🛡️ Security Features

- **Helmet**: Content Security Policy, security headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: 100 req/15min general, 5 req/15min auth
- **Proxy Trust**: Configured for reverse proxy (Nginx/Coolify)
- **Non-root User**: Container runs as `nodejs:nodejs`

### 📁 Build Output Structure

```
/app/
├── dist/public/           # Frontend build (Vite output)
│   ├── index.html        # React SPA entry point
│   ├── assets/           # JS/CSS bundles
│   └── ...
├── server-prod.js        # Bundled backend server
├── node_modules/         # Production dependencies only
└── package.json
```

### 🔍 Health Monitoring

Your app provides these endpoints for Coolify monitoring:

- `GET /health` → `{"status":"ok","timestamp":"..."}`
- `GET /ready` → `{"status":"ready","timestamp":"..."}`
- `GET /api/properties` → API functionality test

### 🌐 Domain Configuration

For your sslip.io domain `t8wsww4occo048kc4w8gg80w.147.93.87.98.sslip.io`:

1. **HTTP to HTTPS**: Configure Coolify to handle SSL termination
2. **CORS Origins**: Add your domain to `ALLOWED_ORIGINS`
3. **CSP**: Content Security Policy allows your domain sources

### 🚨 Troubleshooting

If you see "Frontend build not found":
1. Check build logs in Coolify for `vite build` completion
2. Verify `/dist/public/index.html` exists in container
3. Check server logs for static file path detection

### 🎯 One-Click Deployment Ready

Your Dockerfile and production server are optimized for:
- ✅ Fast builds (esbuild backend bundling)
- ✅ Efficient caching (static asset headers)
- ✅ Security best practices
- ✅ Container health monitoring
- ✅ Graceful error handling
- ✅ Production logging

The deployment is now fully compatible with Coolify and ready for your Ubuntu VPS!
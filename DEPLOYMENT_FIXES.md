# Coolify Deployment Fixes for lejeboligfind.dk

## Issues Fixed

### 1. Docker Build Asset Path Issue
**Problem**: Docker build was failing because it expected `index.css` at `/app/dist/public/index.css` but the build script generated it at `/app/dist/public/assets/index.css`

**Solution**: Updated Dockerfile verification paths:
```dockerfile
# Before (incorrect)
RUN test -f /app/dist/public/index.css || (echo "Frontend build failed: index.css not found" && exit 1)

# After (correct)
RUN test -f /app/dist/public/assets/index.css || (echo "Frontend build failed: index.css not found" && exit 1)
```

### 2. Missing Assets Directory
**Problem**: Build script wasn't creating the `/assets/` directory structure

**Solution**: Updated `build-frontend.js` to create the assets directory:
```javascript
if (!fs.existsSync('dist/public/assets')) {
  fs.mkdirSync('dist/public/assets', { recursive: true });
}
```

### 3. Production Server Configuration
**Problem**: Server needed explicit root route handling and better debugging

**Solution**: Added explicit root route with debugging:
```javascript
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  console.log(`ROOT REQUEST: Looking for index.html at ${indexPath}`);
  // ... rest of handling
});
```

### 4. CORS Configuration
**Problem**: Limited CORS support for domain variants

**Solution**: Updated CORS to support all domain variants:
```javascript
origin: [
  'https://lejeboligfind.dk',
  'https://www.lejeboligfind.dk',
  'http://lejeboligfind.dk',
  'http://www.lejeboligfind.dk'
]
```

### 5. Build Process Reliability
**Problem**: Original build process using Vite was timing out

**Solution**: Created `build-prod.js` that uses esbuild directly:
- Frontend: 575KB JS, 3KB CSS
- Backend: 25KB bundled server
- HTML: 2KB with proper SEO metadata

## Verification Checklist

✅ **App server runs**: Production server binds to `0.0.0.0:5000`
✅ **Frontend assets built**: Files exist at `/app/dist/public/assets/`
✅ **Root route serves HTML**: Explicit `/` route with index.html
✅ **Static files served**: Express.static middleware configured
✅ **Correct port exposed**: Traefik configured for port 5000
✅ **Health checks**: `/health` and `/ready` endpoints available
✅ **Debug endpoint**: `/debug/static` for troubleshooting

## Production Build Files Generated

- `dist/public/index.html` (2KB) - Main HTML with SEO metadata
- `dist/public/assets/index.js` (575KB) - Bundled React application
- `dist/public/assets/index.css` (3KB) - Compiled Tailwind CSS
- `server-prod.js` (25KB) - Production Express server

## Container Startup
The container will:
1. Start the production server on port 5000
2. Serve static files from `/app/dist/public/`
3. Handle root requests with index.html
4. Provide API endpoints under `/api/`
5. Respond to health checks at `/health`

## Next Steps for Deployment
1. Push the updated code to your Git repository
2. Trigger a new deployment in Coolify
3. The build should now complete successfully
4. Access https://lejeboligfind.dk to verify the site loads
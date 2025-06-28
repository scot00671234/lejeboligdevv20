# Production Deployment Guide

## Coolify Deployment Configuration

Your Danish rental property platform is now production-ready. Here's how to deploy it properly on Coolify:

### Environment Variables Required

Set these environment variables in your Coolify deployment:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters
SESSION_SECRET=your-secure-session-secret-at-least-32-characters
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
BCRYPT_ROUNDS=12
```

### Deployment Type

**Important**: Configure as a **Docker Application**, NOT a Static Site.

Your app is a full-stack Node.js application with:
- Express.js backend API
- React frontend (server-side rendered)
- PostgreSQL database integration
- JWT authentication

### Docker Configuration

The included `Dockerfile` and `docker-compose.yml` are optimized for production:

- Multi-stage build for smaller image size
- Non-root user for security
- Health checks for container monitoring
- Proper environment variable handling

### Health Checks

Your app includes production health check endpoints:
- `/health` - Basic health status
- `/ready` - Database connectivity check

### Security Features Included

✅ **Helmet.js** - Security headers
✅ **CORS** - Cross-origin protection
✅ **Rate Limiting** - API protection
✅ **JWT Authentication** - Secure user sessions
✅ **Password Hashing** - bcrypt with configurable rounds
✅ **Input Validation** - Zod schema validation

### Database Setup

Before deployment, ensure:
1. PostgreSQL database is provisioned
2. Database tables are created (run migrations)
3. DATABASE_URL environment variable is set

### Port Configuration

The application runs on port **5000** internally. Coolify will handle external port mapping automatically.

### Build Process

The build process:
1. Installs Node.js dependencies
2. Builds React frontend with Vite
3. Bundles Express backend with esbuild
4. Creates production-optimized Docker image

### Troubleshooting

If deployment fails:

1. **Check Environment Variables**: Ensure all required variables are set
2. **Database Connection**: Verify DATABASE_URL is correct
3. **Memory Limits**: Increase if build fails (minimum 512MB recommended)
4. **Build Timeout**: Increase build timeout for initial deployment

### Testing Deployment

Use the included `production-test.js` script to verify deployment:

```bash
TEST_URL=https://yourdomain.com node production-test.js
```

This tests:
- Health endpoints
- Frontend loading
- API functionality
- Rate limiting
- Database connectivity

Your app is now fully production-ready with enterprise-grade security and monitoring!
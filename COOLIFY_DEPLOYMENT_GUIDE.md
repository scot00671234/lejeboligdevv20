# Complete Coolify Deployment Guide for Danish Rental Platform

## Critical Issues Fixed

Based on your deployment errors, I've addressed these key problems:

1. **Build timeouts** - Added increased timeouts and optimized Docker build
2. **Proxy trust issues** - Fixed Express proxy configuration for Coolify
3. **Database migration** - Added automatic migration on startup
4. **Environment validation** - Added comprehensive startup checks
5. **Container stability** - Improved health checks and error handling

## Step-by-Step Deployment

### 1. Coolify Project Setup

**Important**: Your app is a **full-stack Node.js application**, not a static site.

#### Project Configuration:
- **Type**: Docker Application
- **Build Method**: Build from Dockerfile
- **Dockerfile Path**: `./Dockerfile`
- **Build Context**: `.` (root directory)

#### Resource Allocation:
- **Build Memory**: 2GB minimum
- **Build CPU**: 2 cores minimum  
- **Build Timeout**: 30 minutes
- **Runtime Memory**: 512MB minimum

### 2. Environment Variables

Set these in Coolify **before deployment**:

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-very-secure-jwt-secret-minimum-32-characters-long
SESSION_SECRET=your-very-secure-session-secret-minimum-32-characters

# Optional (with defaults)
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### 3. Database Preparation

**Before deploying**, ensure your PostgreSQL database:
- Is created and accessible
- Has correct permissions for your user
- Is reachable from Coolify's network
- Database name matches the one in DATABASE_URL

### 4. Deployment Configuration

#### In Coolify UI:
1. **Source**: Connect your GitHub repository
2. **Build**: Select "Build from Dockerfile"
3. **Port**: Set internal port to **5000**
4. **Health Check**: Set path to `/health`
5. **Environment**: Add all variables from step 2

#### Advanced Settings:
- **Build timeout**: 1800 seconds (30 minutes)
- **Restart policy**: Unless stopped
- **Health check interval**: 30 seconds
- **Health check timeout**: 10 seconds
- **Health check retries**: 3

### 5. Network Configuration

#### Domain Setup:
- **Protocol**: HTTP (Coolify handles HTTPS)
- **Port**: 5000 (internal)
- **Path**: / (root)

#### Security:
- Enable HTTPS redirect
- Set up your domain/subdomain
- Configure firewall rules if needed

## Monitoring Deployment

### Build Phase Logs
Watch for these success indicators:
```
✅ Dependencies installed successfully
✅ Frontend build completed  
✅ Backend bundle created
✅ Docker image built
✅ Container started
```

### Runtime Health Checks
After deployment, verify:
- `/health` returns 200 with status info
- `/ready` returns 200 with database status
- `/` loads the frontend
- `/api/properties` returns 401 (auth required)

## Troubleshooting Common Issues

### Build Failures

**Issue**: "npm ci timeout" or "build taking too long"
**Solution**: 
- Increase build timeout to 30+ minutes
- Increase memory to 2GB+
- Check network connectivity

**Issue**: "Container fails to start"
**Solution**:
- Verify all environment variables are set
- Check DATABASE_URL format
- Ensure database is accessible

**Issue**: "Health check fails"
**Solution**:
- Verify container is running on port 5000
- Check if database connection is working
- Review container logs for errors

### Database Issues

**Issue**: "relation does not exist"
**Solution**:
- Ensure database exists
- Check user permissions
- Verify DATABASE_URL is correct
- Migration runs automatically on startup

**Issue**: "Connection refused"
**Solution**:
- Check DATABASE_URL format
- Verify database server is running
- Check network connectivity from Coolify

## Success Verification

Your deployment is successful when:

1. **Build completes** without timeouts or errors
2. **Container starts** and passes health checks
3. **Frontend loads** at your domain
4. **API responds** to requests
5. **Database connects** successfully
6. **Authentication works** for user registration/login

## Post-Deployment

### Security Checklist:
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] JWT secrets are secure (32+ chars)
- [ ] Database credentials are secure

### Performance Monitoring:
- [ ] Response times < 2 seconds
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Error rates < 1%

### Backup Strategy:
- [ ] Database backups configured
- [ ] Environment variables backed up
- [ ] Application code in version control

## Emergency Procedures

### If Deployment Fails:
1. **Check build logs** for specific errors
2. **Verify environment variables** are correct
3. **Test database connectivity** separately
4. **Review resource allocation** (memory/CPU)
5. **Contact support** with logs if needed

### Quick Rollback:
1. Revert to previous Git commit
2. Redeploy from working version
3. Fix issues in development first
4. Test thoroughly before redeploying

Your Danish rental platform is now production-ready with enterprise-grade security, monitoring, and deployment practices!
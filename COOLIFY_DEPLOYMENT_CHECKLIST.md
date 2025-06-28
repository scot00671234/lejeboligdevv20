# Coolify Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables Configuration
Set these in Coolify **before** starting deployment:

```bash
# Required Variables
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database_name
JWT_SECRET=your-secure-32-character-minimum-jwt-secret
SESSION_SECRET=your-secure-32-character-minimum-session-secret

# Optional Variables
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### 2. Database Preparation
Before deployment, ensure:
- [ ] PostgreSQL database is created
- [ ] Database is accessible from deployment environment
- [ ] Connection string is correct in DATABASE_URL
- [ ] Database tables will be created during deployment

### 3. Coolify Project Configuration

#### Application Type
- [ ] Set as **"Docker Application"** (NOT Static Site)
- [ ] Use **"Build from Dockerfile"** option
- [ ] Set build context to root directory (.)

#### Build Settings
- [ ] Build timeout: **20 minutes minimum**
- [ ] Memory limit: **1GB minimum** for build process
- [ ] CPU limit: **2 cores minimum** for build

#### Network Settings
- [ ] Internal port: **5000**
- [ ] Protocol: **HTTP**
- [ ] Health check path: **/health**

## Deployment Steps

### Step 1: Repository Configuration
1. Ensure repository contains:
   - [ ] `Dockerfile` (provided)
   - [ ] `.dockerignore` (provided)
   - [ ] `nixpacks.toml` (provided)
   - [ ] All source code files

### Step 2: Build Configuration
1. In Coolify, select **"Build from Dockerfile"**
2. Set dockerfile path: `./Dockerfile`
3. Set build context: `.` (root directory)

### Step 3: Environment Variables
1. Add all required environment variables listed above
2. **Critical**: Ensure DATABASE_URL is set correctly
3. Generate secure JWT_SECRET (32+ characters)
4. Generate secure SESSION_SECRET (32+ characters)

### Step 4: Database Migration
The app will automatically create database tables on first run, but ensure:
1. Database exists and is accessible
2. User has CREATE TABLE permissions
3. Connection string includes correct database name

### Step 5: Deployment Monitoring
During deployment, watch for:
- [ ] Docker build completes successfully
- [ ] Container starts without errors
- [ ] Health check endpoint responds
- [ ] Database connection established

## Troubleshooting Common Issues

### Build Failures
**Issue**: Docker build timeout
**Solution**: Increase build timeout to 20+ minutes, memory to 1GB+

**Issue**: npm install fails
**Solution**: Check network connectivity, try clearing npm cache

**Issue**: Database connection fails
**Solution**: Verify DATABASE_URL format and database accessibility

### Runtime Failures
**Issue**: Container crashes on startup
**Solution**: Check environment variables, especially DATABASE_URL and secrets

**Issue**: Health check fails
**Solution**: Verify container is listening on port 5000, check logs

**Issue**: Database tables missing
**Solution**: Run database migration manually or check permissions

## Post-Deployment Verification

### Health Checks
Test these endpoints after deployment:
- [ ] `GET /health` - Should return 200 with status info
- [ ] `GET /ready` - Should return 200 if database connected
- [ ] `GET /` - Should load the frontend application
- [ ] `GET /api/properties` - Should return 401 (auth required) or data

### Security Verification
- [ ] HTTPS is working
- [ ] CORS headers are present
- [ ] Rate limiting is active
- [ ] Security headers are set

### Performance Checks
- [ ] Response times under 2 seconds
- [ ] Memory usage stable
- [ ] No memory leaks over time

## Emergency Rollback Plan

If deployment fails:
1. **Immediate**: Revert to previous working version
2. **Debug**: Check logs for specific error messages
3. **Fix**: Address issues in development environment first
4. **Redeploy**: Only after testing fixes locally

## Success Criteria

Deployment is successful when:
- [ ] All health checks pass
- [ ] Frontend loads correctly
- [ ] API endpoints respond properly
- [ ] Database operations work
- [ ] User registration/login functions
- [ ] Property listings display
- [ ] No critical errors in logs

Your Danish rental platform will be production-ready once all items are checked!
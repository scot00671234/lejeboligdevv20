# Coolify Deployment Troubleshooting

Your app built successfully but is failing at runtime. Here's what to check:

## Immediate Actions Needed:

### 1. Check Container Logs
In Coolify, go to your app → **"Logs"** tab to see why the container is restarting. Look for:
- Database connection errors
- Missing environment variables
- Port binding issues
- Startup script failures

### 2. Verify Environment Variables
Ensure all these are set correctly in Coolify:

**Required Variables:**
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://lejebolig_user:ukZtjU3CNdSxqZwmgtc96oK9BXTcQwOETpvwtDpN0oDtCFAwxYBTtBbllHzEZgN1@lejebolig-db:5432/postgres`
- `JWT_SECRET` (your 32+ char secret)
- `SESSION_SECRET` (your 32+ char secret)

### 3. Database Connection Issue
The most likely problem is the DATABASE_URL format. Try this format instead:

**Internal Coolify Format:**
```
postgresql://lejebolig_user:ukZtjU3CNdSxqZwmgtc96oK9BXTcQwOETpvwtDpN0oDtCFAwxYBTtBbllHzEZgN1@lejebolig-db.coolify:5432/postgres
```

### 4. Check Database Status
Verify your `lejebolig-db` database container is running and healthy in Coolify.

### 5. Fix Database Port Mapping
In your database settings, change the port mapping from `3000:5432` to `5432:5432`.

## Common Error Patterns:

**"Database connection failed"** → Fix DATABASE_URL format
**"Environment variable missing"** → Add missing vars
**"Port already in use"** → Check port conflicts
**"Permission denied"** → Check startup script permissions

## Quick Fix Steps:

1. **View container logs** in Coolify
2. **Update DATABASE_URL** with correct internal hostname
3. **Restart the application** after fixing environment variables
4. **Check database is running** and accessible

## Test Commands:

Once fixed, these URLs should work:
- `http://yourdomain/health` - Should return 200 OK
- `http://yourdomain/ready` - Should return 200 if database connected
- `http://yourdomain/` - Should load your rental platform

The container is restarting because it's failing health checks, which means the app isn't starting on port 5000 as expected.
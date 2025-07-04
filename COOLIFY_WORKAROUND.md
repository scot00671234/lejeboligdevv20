# Coolify Domain Issue Workaround

## Problem: Domain Field is Grayed Out
The domain field shows `hubcorner.xyz,www.hubcorner.xyz` but is not editable in the application settings.

## Solution Options:

### Option 1: Create New Application
1. Create a new application in Coolify with the correct domain `lejeboligfind.dk`
2. Use the same GitHub repository
3. Set environment variables: `NODE_ENV=production`
4. Deploy fresh with correct domain

### Option 2: Project-Level Domain Settings
1. Go to the PROJECT settings (not application settings)
2. Look for domain configuration at the project level
3. Change domain there, then redeploy

### Option 3: Environment Variable Override
Add this environment variable in Coolify:
```
ALLOWED_ORIGINS=https://lejeboligfind.dk,https://www.lejeboligfind.dk,http://lejeboligfind.dk,http://www.lejeboligfind.dk
```

## Current Status
- Application code is production-ready
- Docker builds successfully 
- Rate limiting issues fixed
- All domain references in code are correct (lejeboligfind.dk)

The only issue is the Coolify domain configuration mismatch.
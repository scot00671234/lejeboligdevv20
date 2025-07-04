# URGENT: Coolify Domain Configuration Fix

## 🚨 **Root Cause Identified**
Your Coolify deployment is configured with **hubcorner.xyz** instead of **lejeboligfind.dk**

From deployment logs:
```
COOLIFY_URL=hubcorner.xyz,www.hubcorner.xyz
COOLIFY_FQDN=hubcorner.xyz,www.hubcorner.xyz
```

## ✅ **Fixed Issues:**
1. **Rate Limiting Error**: Removed rate limiting causing `ERR_ERL_PERMISSIVE_TRUST_PROXY` crashes
2. **Production Build**: Updated and working (575KB JS, 3KB CSS, 25KB server)
3. **CORS Configuration**: Already set for lejeboligfind.dk

## 🔧 **Required Coolify Configuration Changes:**

### Step 1: Update Domain Configuration
In your Coolify dashboard:

1. Go to your application settings
2. Find **Domain/URL Configuration** 
3. Change from:
   - `hubcorner.xyz,www.hubcorner.xyz`
4. To:
   - `lejeboligfind.dk,www.lejeboligfind.dk`

### Step 2: Update Environment Variables
Set these in Coolify:
```
COOLIFY_URL=lejeboligfind.dk,www.lejeboligfind.dk
COOLIFY_FQDN=lejeboligfind.dk,www.lejeboligfind.dk
NODE_ENV=production
```

### Step 3: Redeploy
After domain configuration changes:
1. Trigger a new deployment
2. The container will now use correct domain references

## ✅ **Application Status:**
- **Code**: ✅ All domain references corrected
- **Docker**: ✅ Build working without rate limiting errors  
- **Database**: ✅ Connected and functional
- **Security**: ✅ Helmet and CORS properly configured
- **Production Build**: ✅ Optimized assets generated

## 🎯 **Next Action:**
Change the domain configuration in Coolify from `hubcorner.xyz` to `lejeboligfind.dk` and redeploy.
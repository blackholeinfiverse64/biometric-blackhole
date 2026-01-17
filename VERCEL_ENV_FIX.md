# Fix Vercel Environment Variable

## Issue
The frontend is trying to connect to the wrong backend URL:
- ❌ Current (incorrect): `https://attendance-api.onrender.com`
- ✅ Should be: `https://biometric-blackhole.onrender.com`

## Solution

### Update Vercel Environment Variable

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project: **biometric-blackhole**
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_BASE_URL`
5. **Update the value** to: `https://biometric-blackhole.onrender.com`
6. Make sure it's set for:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
7. Click **Save**
8. **Redeploy** your frontend:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

## Verification

After redeploying, check:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try uploading a file
4. Verify the request goes to: `https://biometric-blackhole.onrender.com/api/process`
5. Should NOT see: `attendance-api.onrender.com`

## Code Status

✅ **Frontend code is correct** - uses `VITE_API_BASE_URL` environment variable
✅ **No hardcoded URLs** in the frontend codebase
✅ **Config file** properly reads from environment variable

The issue is only in the Vercel environment variable setting.



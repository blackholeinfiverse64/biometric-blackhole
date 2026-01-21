# 🚨 Fix Blank Screen After Deployment

## Problem
After deploying to Vercel, you see a **blank screen** even though it works on localhost.

## Root Cause
The `.env` file is **NOT deployed** to Vercel. Environment variables must be set in Vercel Dashboard.

---

## ✅ Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project: **biometric-blackhole** (or your project name)

### Step 2: Add Environment Variables
1. Click **Settings** (top menu)
2. Click **Environment Variables** (left sidebar)
3. Add these **TWO** variables:

#### Variable 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://osmigrirwikgivaucwix.supabase.co`
- **Environments:** ✅ Production ✅ Preview ✅ Development

#### Variable 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_Zyp2jDK-4N27BeD_Vz7dLg_23zmeJ3t`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Step 3: Save and Redeploy
1. Click **Save** for each variable
2. Go to **Deployments** tab
3. Click the **three dots (⋯)** on the latest deployment
4. Click **Redeploy**
5. Wait for deployment to complete

---

## ✅ Your Environment Variables

Copy these exact values:

```
VITE_SUPABASE_URL=https://osmigrirwikgivaucwix.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Zyp2jDK-4N27BeD_Vz7dLg_23zmeJ3t
```

---

## 🔍 Verify It's Working

After redeploying:
1. Open your deployed site
2. Open browser console (F12)
3. You should see:
   - ✅ `Supabase URL: ✅ Set`
   - ✅ `Supabase Key: ✅ Set`
4. No more blank screen!

---

## 📝 Quick Checklist

- [ ] Added `VITE_SUPABASE_URL` in Vercel
- [ ] Added `VITE_SUPABASE_ANON_KEY` in Vercel
- [ ] Both set for Production, Preview, and Development
- [ ] Clicked Save
- [ ] Redeployed the project
- [ ] Checked browser console for success messages

---

## 🎯 Why This Happens

- ✅ Localhost: Reads from `frontend/.env` file
- ❌ Production: `.env` file is NOT deployed (for security)
- ✅ Solution: Set variables in Vercel Dashboard

---

## 🚀 After Fixing

Your app should work perfectly on Vercel! 🎉


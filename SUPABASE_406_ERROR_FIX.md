# Fixing 406 Error - Supabase Setup Required

## Problem
You're seeing 406 errors when trying to access Supabase tables. This means:
- **Tables don't exist** in your Supabase database, OR
- **RLS (Row Level Security) policies** are blocking access

## Solution: Create Tables in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Schema SQL
1. Open the file `supabase_schema.sql` from this project
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

This will create all required tables:
- `profiles`
- `attendance_reports`
- `manual_users`
- `confirmed_salaries`
- `finalized_salaries`
- `hour_rates`

### Step 3: Add Daily Records Column
1. Open the file `supabase_schema_update.sql`
2. Copy the SQL code
3. Paste it into Supabase SQL Editor
4. Click **Run**

This adds the `daily_records` column to `manual_users` table.

### Step 4: Verify Tables Created
1. In Supabase Dashboard, go to **Table Editor**
2. You should see all 6 tables listed:
   - ✅ profiles
   - ✅ attendance_reports
   - ✅ manual_users
   - ✅ confirmed_salaries
   - ✅ finalized_salaries
   - ✅ hour_rates

### Step 5: Verify RLS Policies
1. In Supabase Dashboard, go to **Authentication** → **Policies**
2. Make sure RLS is enabled for all tables
3. The policies should allow users to access only their own data

## What I Fixed in the Code

✅ **Better Error Handling**: Now gracefully handles 406 errors
✅ **Fallback to localStorage**: If Supabase fails, uses localStorage as backup
✅ **Upload.jsx Updated**: Now saves processed files to Supabase
✅ **Error Messages**: Better console messages to help debug

## Testing

After running the SQL:
1. **Refresh** your browser
2. **Upload a file** and process it
3. **Check browser console** - should see "✅ Saved to Supabase successfully"
4. **Navigate to Reports** - data should load from Supabase

## If Still Getting Errors

1. **Check Environment Variables**:
   - `VITE_SUPABASE_URL` is set correctly
   - `VITE_SUPABASE_ANON_KEY` is set correctly

2. **Check RLS Policies**:
   - Go to Supabase Dashboard → Authentication → Policies
   - Make sure policies allow SELECT, INSERT, UPDATE, DELETE for authenticated users

3. **Check Table Structure**:
   - Verify all columns exist as defined in `supabase_schema.sql`
   - Check that `daily_records` column exists in `manual_users` table

4. **Check Browser Console**:
   - Look for specific error messages
   - The code now provides better error details

## Quick Fix (Temporary)

If you need to use the app immediately while setting up Supabase:
- The app will automatically fallback to localStorage
- Your data will be saved locally in the browser
- Once Supabase is set up, data will migrate automatically


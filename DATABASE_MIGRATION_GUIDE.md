# Database Migration Guide - localStorage to Supabase

## Overview
The application has been migrated from localStorage (temporary browser storage) to Supabase (permanent cloud database) for user-specific data storage.

## What Changed

### ✅ Data Now Stored in Supabase (Permanent)
- **Attendance Reports** - Main processed attendance data
- **Manual Users** - Manually added employees
- **Manual User Daily Records** - Daily attendance for manual users
- **Confirmed Salaries** - Salary confirmations
- **Finalized Salaries** - Finalized salary reports by month
- **Hour Rates** - Employee hour rates

### 📦 Data Still in localStorage (Temporary UI State)
- **expandedBuckets** - UI state for expanded/collapsed sections (can stay in localStorage)

## Database Schema

### Required Tables
All tables are defined in `supabase_schema.sql`. Run this SQL in your Supabase SQL Editor to create the tables.

### Schema Update Required
Run `supabase_schema_update.sql` to add the `daily_records` column to `manual_users` table:

```sql
ALTER TABLE public.manual_users 
ADD COLUMN IF NOT EXISTS daily_records JSONB DEFAULT '[]'::jsonb;
```

## Setup Instructions

### 1. Create Supabase Tables
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the contents of `supabase_schema.sql` to create all tables
4. Run `supabase_schema_update.sql` to add the `daily_records` column

### 2. Verify Row Level Security (RLS)
The schema includes RLS policies that ensure users can only access their own data. Verify these policies are active:
- `profiles` - Users can view/update own profile
- `attendance_reports` - Users can manage own reports
- `manual_users` - Users can manage own manual users
- `confirmed_salaries` - Users can manage own confirmed salaries
- `finalized_salaries` - Users can manage own finalized salaries
- `hour_rates` - Users can manage own hour rates

### 3. Environment Variables
Ensure your `frontend/.env` file has:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### Data Loading
- On component mount, all data is loaded from Supabase
- Data is user-specific (filtered by `user_id`)
- If Supabase fails, falls back to localStorage for migration

### Data Saving
- All data changes are automatically saved to Supabase
- Operations are non-blocking (errors are logged but don't block UI)
- Data is saved immediately when state changes

### User Authentication
- All data operations require user authentication
- Each user can only access their own data (enforced by RLS)
- Data is automatically associated with the logged-in user

## Migration from localStorage

### Automatic Migration
The code includes fallback logic:
1. First, tries to load from Supabase
2. If Supabase fails, falls back to localStorage
3. Data is then saved to Supabase when user makes changes

### Manual Migration (Optional)
If you have existing localStorage data you want to migrate:
1. Export data from browser localStorage
2. Use Supabase Dashboard to insert data manually
3. Or create a migration script to transfer data

## Benefits

✅ **Permanent Storage** - Data persists across devices and browsers
✅ **User-Specific** - Each user has their own isolated data
✅ **Secure** - Row Level Security ensures data privacy
✅ **Scalable** - Cloud database can handle large amounts of data
✅ **Backup** - Supabase automatically backs up your data
✅ **Multi-Device** - Access your data from any device

## Troubleshooting

### Data Not Loading
- Check Supabase connection (environment variables)
- Verify user is authenticated
- Check browser console for errors
- Verify RLS policies are active

### Data Not Saving
- Check Supabase connection
- Verify user is authenticated
- Check browser console for errors
- Verify table structure matches schema

### Permission Errors
- Verify RLS policies are correctly set
- Check that `user_id` matches authenticated user
- Verify table permissions in Supabase

## Testing

1. **Login** with a user account
2. **Create/Edit** some data (manual users, salaries, etc.)
3. **Logout** and **Login** again
4. **Verify** data persists (should load from Supabase)
5. **Check Supabase Dashboard** to see data in tables

## Next Steps

- Monitor Supabase usage and costs
- Set up database backups
- Consider adding data export functionality
- Add data migration tools if needed


# Role-Based Dashboard Routing Guide

## Overview
The application now supports role-based routing, where different user credentials can be directed to different dashboards based on their role or email.

## How It Works

### 1. Role-Based Routing Priority
The system checks user routing in the following order:

1. **Profile Role** (Highest Priority)
   - If the user's profile has a `role` field set in the `profiles` table
   - Roles: `admin`, `administrator`, `manager`, `employee`, `staff`

2. **Email Keywords** (Fallback)
   - Checks email address for keywords:
     - `admin` or `administrator` → Admin dashboard
     - `manager` or `mgr` → Manager dashboard
     - `employee`, `staff`, or `emp` → Employee dashboard

3. **Email Domain** (Last Resort)
   - Checks email domain for keywords like `admin` or `management`

4. **Default Route**
   - If none match, routes to `/reports`

### 2. Setting Up User Roles

#### Option A: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **Table Editor** → `profiles` table
3. Add a `role` column if it doesn't exist:
   - Column name: `role`
   - Type: `text`
   - Default value: `employee`
4. Update existing users with their roles:
   - `admin` for administrators
   - `manager` for managers
   - `employee` for regular employees

#### Option B: Using SQL
Run this SQL in Supabase SQL Editor:

```sql
-- Add role column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

-- Update specific users with roles
UPDATE profiles 
SET role = 'admin' 
WHERE email LIKE '%admin%' OR email LIKE '%administrator%';

UPDATE profiles 
SET role = 'manager' 
WHERE email LIKE '%manager%' OR email LIKE '%mgr%';

UPDATE profiles 
SET role = 'employee' 
WHERE role IS NULL;
```

### 3. Email-Based Routing (No Database Changes)
If you don't want to modify the database, you can use email-based routing:

- **Admin emails**: Include `admin` or `administrator` in the email
  - Example: `admin@company.com`, `administrator@company.com`
  
- **Manager emails**: Include `manager` or `mgr` in the email
  - Example: `manager@company.com`, `john.mgr@company.com`
  
- **Employee emails**: Include `employee`, `staff`, or `emp` in the email
  - Example: `employee@company.com`, `staff@company.com`

### 4. Customizing Dashboard Routes

To customize which route each role goes to, edit `frontend/src/pages/Auth.jsx`:

```javascript
const getDashboardRoute = (profile, email) => {
  if (profile?.role === 'admin') {
    return '/reports' // Change to '/admin-dashboard' if you create one
  } else if (profile?.role === 'employee') {
    return '/reports' // Change to '/employee-dashboard' if you create one
  }
  // ... rest of the logic
}
```

### 5. Testing

1. **Create test users with different roles:**
   - Admin user: `admin@test.com` (or set role to `admin`)
   - Manager user: `manager@test.com` (or set role to `manager`)
   - Employee user: `employee@test.com` (or set role to `employee`)

2. **Login with each user** and verify they are routed correctly

3. **Check the console** for any routing errors

## Current Implementation

- ✅ Profile role fetching from Supabase
- ✅ Email-based routing fallback
- ✅ Automatic role assignment on signup (based on email)
- ✅ Role-based redirect after login
- ✅ Default route handling

## Next Steps (Optional)

1. **Create separate dashboard pages** for different roles
2. **Add route protection** to restrict access based on role
3. **Add role-based UI** (show/hide features based on role)
4. **Add role management** in admin panel

## Troubleshooting

**Issue**: All users go to the same dashboard
- **Solution**: Check if the `role` column exists in the `profiles` table
- **Solution**: Verify email keywords match the routing logic
- **Solution**: Check browser console for errors

**Issue**: Users not being redirected after login
- **Solution**: Ensure `userProfile` is being fetched correctly
- **Solution**: Check Supabase connection and permissions

**Issue**: Profile not found
- **Solution**: Ensure profile is created on signup
- **Solution**: Check Supabase RLS (Row Level Security) policies


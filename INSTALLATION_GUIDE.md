# Complete Installation & Setup Guide

## Step 1: Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

## Step 2: Create Required Directories

```bash
# Create contexts directory
mkdir -p frontend/src/contexts

# Create services directory
mkdir -p frontend/src/services

# Create lib directory
mkdir -p frontend/src/lib
```

## Step 3: Copy All New Files

Copy these files to your project:

1. `frontend/src/lib/supabase.js`
2. `frontend/src/contexts/AuthContext.jsx`
3. `frontend/src/pages/Auth.jsx`
4. `frontend/src/services/supabaseService.js`
5. `frontend/src/App.jsx` (replace existing)

## Step 4: Create Environment File

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Run SQL Schema in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste contents of `supabase_schema.sql`
3. Click "Run"

## Step 6: Update Layout Component

Add logout button to `frontend/src/components/Layout.jsx`:

```javascript
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

// In component:
const { user, signOut } = useAuth()
const navigate = useNavigate()

const handleLogout = async () => {
  await signOut()
  navigate('/auth')
}

// Add in header/navbar:
{user && (
  <button onClick={handleLogout} className="btn-secondary">
    Logout
  </button>
)}
```

## Step 7: Update Reports.jsx to Use Supabase

Replace localStorage calls with Supabase service calls:

**Before:**
```javascript
localStorage.setItem('lastProcessResult', JSON.stringify(data))
```

**After:**
```javascript
import { saveAttendanceReport } from '../services/supabaseService'
await saveAttendanceReport(data)
```

**Key Replacements:**
- `localStorage.getItem('lastProcessResult')` → `await getAttendanceReport(year, month)`
- `localStorage.setItem('lastProcessResult', ...)` → `await saveAttendanceReport(...)`
- `localStorage.getItem('manualUsers')` → `await getManualUsers()`
- `localStorage.setItem('manualUsers', ...)` → `await saveManualUsers(...)`
- `localStorage.getItem('finalizedSalariesByMonth')` → `await getFinalizedSalaries()`
- `localStorage.setItem('finalizedSalariesByMonth', ...)` → `await saveFinalizedSalaries(...)`

## Step 8: Update Upload.jsx

Replace localStorage save with Supabase:

```javascript
import { saveAttendanceReport } from '../services/supabaseService'

// After processing:
await saveAttendanceReport(response.data)
```

## Step 9: Test the Application

1. Start dev server: `npm run dev`
2. Navigate to `/auth`
3. Create an account
4. Upload a file
5. Check Supabase dashboard to verify data is saved

## Step 10: Deploy to Vercel

1. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Deploy

---

## Files Created/Modified Summary

### New Files:
- ✅ `frontend/src/lib/supabase.js`
- ✅ `frontend/src/contexts/AuthContext.jsx`
- ✅ `frontend/src/pages/Auth.jsx`
- ✅ `frontend/src/services/supabaseService.js`
- ✅ `supabase_schema.sql`
- ✅ `frontend/.env` (you create this)

### Modified Files:
- ✅ `backend/api.py` (added year/month to response)
- ✅ `frontend/src/App.jsx` (added auth routes)
- ✅ `frontend/src/pages/Reports.jsx` (all features added)
- ⚠️ `frontend/src/components/Layout.jsx` (needs logout button)
- ⚠️ `frontend/src/pages/Upload.jsx` (needs Supabase integration)

---

## Next Steps

1. Complete Supabase setup (get URL and keys)
2. Run SQL schema
3. Update Reports.jsx to use Supabase services
4. Update Upload.jsx to use Supabase services
5. Test authentication flow
6. Test data persistence


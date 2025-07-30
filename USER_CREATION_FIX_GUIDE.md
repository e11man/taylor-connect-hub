# User Creation Database Error Fix Guide

## Problem
When creating a new user in the Unity Connect TAU app, you're getting a "Database error saving new user" error.

## Root Causes
1. Missing or incorrect environment variables
2. Database trigger/function issues
3. Missing table columns or constraints
4. Permission issues

## Solution Steps

### Step 1: Configure Environment Variables
I've created a `.env` file with your Supabase credentials. Make sure this file is in your project root:

```
VITE_SUPABASE_URL=https://gzzbjifmrwvqbkwbyvhm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o
DATABASE_URL=postgresql://postgres:Idonotunderstandwhatido!@db.gzzbjifmrwvqbkwbyvhm.supabase.co:5432/postgres
```

### Step 2: Run Database Diagnostics and Fixes
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `FIX_USER_CREATION_ERROR.sql`
4. Execute the script

This script will:
- Check if all required tables and columns exist
- Fix the `handle_new_user` function to handle errors gracefully
- Add proper error logging
- Fix any orphaned users
- Grant necessary permissions

### Step 3: Apply the Fix Migration
Create a new migration file in your Supabase migrations folder:

```bash
cd supabase/migrations
# Create a new migration file with current timestamp
touch $(date +%Y%m%d%H%M%S)_fix_user_creation_error.sql
```

Then copy the function fix from `FIX_USER_CREATION_ERROR.sql` (section 5) into this migration file.

### Step 4: Test the Fix
1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try creating a new user through the signup form

3. Check the Supabase logs:
   - Go to Supabase Dashboard → Logs → Postgres
   - Look for any error messages or the debug notices from our function

### Step 5: Verify User Creation
Run this query in Supabase SQL Editor to check if users are being created properly:

```sql
-- Check recent user creations
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    p.id as profile_id,
    p.status as profile_status,
    ur.role as user_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at DESC
LIMIT 10;
```

## Common Issues and Solutions

### Issue 1: "duplicate key value violates unique constraint"
**Solution**: A user with this email already exists. Either use a different email or delete the existing user.

### Issue 2: "permission denied for table profiles"
**Solution**: Run the permission grants in section 7 of the SQL script.

### Issue 3: "column 'status' does not exist"
**Solution**: The profiles table is missing the status column. Run this:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('pending', 'active', 'blocked'));
```

### Issue 4: Environment variables not loading
**Solution**: 
1. Make sure `.env` file is in the project root
2. Restart your development server
3. Check that you're using `import.meta.env` in Vite

## Deployment Considerations

### For Vercel Deployment:
1. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   
2. Do NOT commit the `.env` file to git (it should be in `.gitignore`)

3. Run the database fixes in your production Supabase instance

## Testing Different User Types

### Student User (Taylor Email):
```javascript
{
  email: "test@taylor.edu",
  password: "testpassword123",
  user_type: "student",
  dorm: "Bergwall Hall",
  wing: "2nd Bergwall"
}
```

### External User (Non-Taylor Email):
```javascript
{
  email: "external@gmail.com",
  password: "testpassword123",
  user_type: "external",
  dorm: "Off Campus",
  wing: "N/A"
}
```

### Organization:
```javascript
{
  email: "org@example.com",
  password: "testpassword123",
  user_type: "organization",
  organization_name: "Test Organization",
  description: "Test org description"
}
```

## Need More Help?

If you're still experiencing issues:

1. Check the browser console for JavaScript errors
2. Check the Network tab for failed API requests
3. Check Supabase logs for database errors
4. Ensure your Supabase project is not paused (free tier limitation)

The enhanced error logging in the updated `handle_new_user` function will help identify the exact issue.
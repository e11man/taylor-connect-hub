# 🚨 URGENT: Fix Admin Login Database Configuration Error

## Problem
The admin console shows "Database configuration error. Please contact system administrator." This is caused by:
1. Missing `role` column in the `profiles` table
2. Restrictive Row Level Security (RLS) policies
3. Missing environment variables in Vercel

## Solution Steps

### Step 1: Apply Database Fix (CRITICAL - DO THIS FIRST!)

1. **Open Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/sql/new
   ```

2. **Copy the ENTIRE contents of `FIX_ADMIN_DATABASE_ERROR.sql`** and paste it into the SQL editor

3. **Click "RUN" to execute the script**

4. **Verify the fix worked** - You should see:
   - "✅ Database configuration fixed! Admin login should now work."
   - Test results showing the role column exists
   - List of admin users

### Step 2: Configure Vercel Environment Variables

1. **Go to your Vercel project settings**:
   ```
   https://vercel.com/[your-team]/[your-project]/settings/environment-variables
   ```

2. **Add these environment variables** (if not already present):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://gzzbjifmrwvqbkwbyvhm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Anon Key from Supabase]
   SUPABASE_SERVICE_ROLE_KEY=[Your Service Role Key from Supabase]
   ```

3. **Get your keys from Supabase**:
   - Go to: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/settings/api
   - Copy the `anon` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the `service_role` key for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

4. **Redeploy your Vercel app** to apply the environment variables

### Step 3: Test Admin Login

1. **Wait 2-3 minutes** for the database changes to propagate

2. **Try logging in** at your admin console:
   ```
   https://9371af.vercel.app/admin
   ```

3. **Use your admin credentials**:
   - Email: `admin@taylor.edu` (or whatever admin email exists in your database)
   - Password: Your admin password

### Step 4: If It Still Doesn't Work

1. **Check browser console** for errors (F12 → Console tab)

2. **Run this test query in Supabase**:
   ```sql
   -- Check if your admin user exists and has proper role
   SELECT 
     u.email,
     ur.role as user_role,
     p.role as profile_role
   FROM auth.users u
   LEFT JOIN public.user_roles ur ON u.id = ur.user_id
   LEFT JOIN public.profiles p ON u.id = p.user_id
   WHERE u.email = 'admin@taylor.edu';  -- Replace with your admin email
   ```

3. **If no admin user exists**, create one:
   ```sql
   -- First, create the user in Supabase Auth
   -- Go to Authentication → Users → Invite User
   -- Then run this to set admin role:
   
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'
   FROM auth.users
   WHERE email = 'admin@taylor.edu'  -- Your admin email
   ON CONFLICT (user_id) 
   DO UPDATE SET role = 'admin';
   ```

## What This Fix Does

1. **Adds `role` column to `profiles` table** - The admin login code tries to read this as a fallback
2. **Syncs roles between tables** - Ensures `user_roles` and `profiles` have consistent data
3. **Fixes RLS policies** - Allows users to read their own roles without recursive checks
4. **Creates helper function** - `is_admin()` for easier admin checks
5. **Ensures admin user exists** - Updates the admin@taylor.edu user to have admin role

## Quick Troubleshooting

- **"Invalid credentials"** → Wrong email/password
- **"Database configuration error"** → Run the SQL fix script
- **"You do not have admin privileges"** → User exists but doesn't have admin role
- **Page doesn't load** → Check Vercel environment variables

## Need More Help?

1. Check the Supabase logs: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/logs/edge-logs
2. Review the browser console for JavaScript errors
3. Verify all environment variables are set in Vercel
4. Make sure you've redeployed after adding environment variables
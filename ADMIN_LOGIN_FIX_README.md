# 🔧 Admin Login Fix: "Database error querying schema"

## 🚨 Problem Summary

The "Database error querying schema" occurs when:
1. The `user_roles` table has restrictive RLS policies preventing users from reading their own roles
2. The Supabase client lacks proper environment variables
3. Queries attempt to access protected schemas with insufficient permissions

## ✅ Solution Overview

This fix provides a **3-layer solution**:

### 1. **Enhanced Client-Side Error Handling** (`src/pages/AdminLogin.tsx`)
- Improved error handling with fallback mechanisms
- Tries multiple approaches to verify admin role
- Clear error messages for debugging

### 2. **Server-Side API Route** (`src/pages/api/auth/admin-login.ts`)
- Uses service role key to bypass RLS restrictions
- Provides secure admin authentication endpoint
- Optional: Can be used if client-side approach fails

### 3. **Database RLS Fix** (`src/database/fix-admin-login-rls.sql`)
- Fixes Row Level Security policies
- Allows users to read their own roles
- Prevents recursive policy checks

## 🚀 Deployment Steps

### Step 1: Apply Database Fix (URGENT)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/sql/new
   ```

2. **Run the RLS Fix Script**
   - Copy the entire contents of `src/database/fix-admin-login-rls.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify the Fix**
   ```sql
   -- Test if users can read their own role
   SELECT * FROM public.user_roles WHERE user_id = auth.uid();
   ```

### Step 2: Set Environment Variables in Vercel

1. **Go to Vercel Project Settings**
   ```
   https://vercel.com/[your-org]/[your-project]/settings/environment-variables
   ```

2. **Add Required Variables**
   ```bash
   # Client-side variables (required)
   NEXT_PUBLIC_SUPABASE_URL=https://gzzbjifmrwvqbkwbyvhm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # Server-side variable (optional but recommended)
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Redeploy the Application**
   - Trigger a new deployment in Vercel
   - Or push a commit to trigger auto-deployment

### Step 3: Test the Login Flow

1. **Test with Valid Admin Credentials**
   - Email: admin@example.com (or your admin email)
   - Password: your-admin-password
   - Should successfully redirect to `/admin/dashboard`

2. **Test with Non-Admin User**
   - Should show: "You do not have admin privileges"

3. **Check Browser Console**
   - Look for any error messages
   - Verify no "schema" errors appear

## 🛡️ How The Fix Works

### Client-Side Login Flow (`AdminLogin.tsx`)
```typescript
// 1. Authenticate user
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// 2. Try to read user role (with fallback)
try {
  // Primary: Query user_roles table
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id);
    
  // Fallback: Query profiles table if user_roles fails
  if (error) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id);
  }
} catch (error) {
  // Provide helpful error message
}
```

### RLS Policy Fix
```sql
-- Critical: Allow users to read their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);
```

## 🔍 Debugging Checklist

If login still fails:

### ✅ 1. Verify Environment Variables
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### ✅ 2. Check RLS Policies
```sql
-- List all policies on user_roles
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

### ✅ 3. Verify User Role Exists
```sql
-- Check if user has a role entry
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';
```

### ✅ 4. Test Direct Query
```sql
-- Run as the authenticated user
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

## 🚑 Emergency Fallback

If the client-side fix doesn't work, use the API route:

```javascript
// Alternative: Use server-side API
const response = await fetch('/api/auth/admin-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
if (data.success) {
  // Set session and redirect
}
```

## 📋 Summary

The fix addresses the root causes:
1. ✅ **RLS Policies**: Users can now read their own roles
2. ✅ **Error Handling**: Graceful fallbacks for schema errors  
3. ✅ **Environment Variables**: Proper Supabase initialization
4. ✅ **Server-Side Option**: API route with service role key

After applying these fixes, the admin login should work without any "Database error querying schema" errors.

## 🆘 Still Having Issues?

1. Check Supabase service status: https://status.supabase.com/
2. Verify your Supabase project is active
3. Ensure your database hasn't hit any limits
4. Contact support with error logs from browser console
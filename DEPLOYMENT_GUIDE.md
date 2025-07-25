# Deployment Guide: Fixing "Database error querying schema"

## 🔍 Problem Analysis

The "Database error querying schema" error occurs when:
1. Client-side code tries to use `supabase.auth.admin` methods with an anon key
2. The anon key doesn't have permission to access certain system schemas
3. Database policies block access to required tables

## ✅ Solution Overview

### 1. **Fixed Client-Side Code**
- Removed all `supabase.auth.admin` calls from client components
- Use regular Supabase queries that work with anon key
- Added proper error handling for permission issues

### 2. **Added Error Boundaries**
- Created `ErrorBoundary` component to catch and display schema errors
- Provides user-friendly error messages
- Helps identify permission issues quickly

### 3. **Server-Side Admin Operations**
- Created example API route for admin-only operations
- Uses service role key (server-side only)
- Properly validates admin permissions

## 🚀 Deployment to Vercel

### Step 1: Environment Variables

Add these to your Vercel project settings:

```bash
# Required for client-side
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for server-side admin operations (if using API routes)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **IMPORTANT**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client!

### Step 2: Database Setup

Ensure these tables exist in Supabase:

```sql
-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dorm TEXT,
  wing TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT CHECK (role IN ('user', 'pa', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_roles
CREATE POLICY "Anyone can view roles" ON user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 3: Supabase Dashboard Settings

1. Go to Authentication → Policies
2. Ensure RLS is enabled for sensitive tables
3. Check that policies allow anon key to read necessary data

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## 🔧 Troubleshooting

### If you still get schema errors:

1. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs → API
   - Look for permission denied errors

2. **Verify RLS policies**:
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. **Test with SQL Editor**:
   ```sql
   -- Test as anon user
   SET ROLE anon;
   SELECT * FROM profiles LIMIT 1;
   ```

4. **Enable detailed logging**:
   ```typescript
   // In your code
   const { data, error } = await supabase
     .from('profiles')
     .select('*');
   
   if (error) {
     console.error('Supabase error:', {
       message: error.message,
       details: error.details,
       hint: error.hint,
       code: error.code
     });
   }
   ```

## 📝 Key Changes Made

1. **AdminDashboard.tsx**:
   - Removed `supabase.auth.admin.listUsers()`
   - Now queries `profiles` table directly
   - Added `.maybeSingle()` instead of `.single()` for better error handling

2. **Supabase Client**:
   - Added environment variable support
   - Better initialization with proper options
   - Added client-side detection

3. **Error Handling**:
   - Created ErrorBoundary component
   - Added specific schema error detection
   - Better user feedback for permission issues

## 🔐 Security Best Practices

1. **Never expose service role key client-side**
2. **Use RLS policies to control data access**
3. **Validate admin role on every sensitive operation**
4. **Log security events for auditing**
5. **Use API routes for admin-only operations**

## 📞 Support

If issues persist:
1. Check Supabase status page
2. Review database logs in Supabase Dashboard
3. Ensure all migrations have run successfully
4. Contact Supabase support with error details
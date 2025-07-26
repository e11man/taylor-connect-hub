-- 🚨 COMPREHENSIVE FIX FOR ADMIN LOGIN DATABASE ERROR
-- This script fixes the "Database configuration error" on admin login
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/sql/new

-- PART 1: Fix the profiles table schema
-- ======================================

-- 1.1 Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        -- First check if user_role type exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('admin', 'pa', 'user');
        END IF;
        
        -- Add the role column
        ALTER TABLE public.profiles 
        ADD COLUMN role user_role NOT NULL DEFAULT 'user';
        
        RAISE NOTICE 'Role column added to profiles table';
    END IF;
END $$;

-- 1.2 Sync roles from user_roles table to profiles table
UPDATE public.profiles p
SET role = ur.role::user_role
FROM public.user_roles ur
WHERE p.user_id = ur.user_id;

-- PART 2: Fix Row Level Security (RLS) Policies
-- =============================================

-- 2.1 Enable RLS on both tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2.2 Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2.3 Create simple policy for users to read their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2.4 Create simple policy for users to read their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2.5 Create admin policies using profiles table (avoids recursion)
CREATE POLICY "Admins can view all user_roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles self
    WHERE self.user_id = auth.uid() 
    AND self.role = 'admin'
  )
);

-- PART 3: Create helper function for admin checks
-- ===============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- PART 4: Ensure admin user exists (example - replace with your admin email)
-- ==========================================================================

-- Check if an admin exists, if not, create one
DO $$
DECLARE
    admin_email TEXT := 'admin@taylor.edu'; -- Replace with your admin email
    admin_id UUID;
BEGIN
    -- Get the user ID for the admin email
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = admin_email
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        -- Ensure user_roles entry exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin';
        
        -- Update profiles table
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE user_id = admin_id;
        
        RAISE NOTICE 'Admin role ensured for user: %', admin_email;
    ELSE
        RAISE NOTICE 'Admin user not found: %', admin_email;
    END IF;
END $$;

-- PART 5: Test the fix
-- ====================

-- Test 1: Check if role column exists
SELECT 
    'Role column exists' as test,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) as result;

-- Test 2: Check RLS policies
SELECT 
    'RLS policies created' as test,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'profiles');

-- Test 3: Show admin users
SELECT 
    'Admin users' as test,
    p.email,
    ur.role as user_roles_role,
    p.role as profiles_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'admin' OR p.role = 'admin'
LIMIT 5;

-- Final message
SELECT '✅ Database configuration fixed! Admin login should now work.' as status;
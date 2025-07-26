-- Fix Admin Access to Profiles Table
-- This script ensures that admins can properly query the profiles table

-- 1. First, let's check if there are any profiles in the table
SELECT COUNT(*) as profile_count FROM profiles;

-- 2. Create or update the RLS policy for admin access to profiles
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR 
  -- Users can see their own profile
  auth.uid() = user_id
);

-- Create policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Also fix user_roles table access
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all user roles
CREATE POLICY "Admins can view all user roles" 
ON user_roles FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
  OR 
  -- Users can see their own role
  auth.uid() = user_id
);

-- Create policy for admins to manage all user roles
CREATE POLICY "Admins can manage all user roles" 
ON user_roles FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- 4. Create some test data if profiles table is empty
-- Only run this if you need test data
/*
INSERT INTO profiles (user_id, email, dorm, wing, status, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'test1@example.com', 'East Hall', 'A', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'test2@example.com', 'West Hall', 'B', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'test3@example.com', 'North Hall', 'C', 'pending', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;
*/

-- 5. Grant necessary permissions (if using service role)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_roles TO authenticated;

-- 6. Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles')
ORDER BY tablename, policyname;
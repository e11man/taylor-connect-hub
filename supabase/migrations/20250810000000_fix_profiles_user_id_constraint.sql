-- Fix profiles table user_id constraint for direct authentication
-- This migration removes the dependency on auth.users for direct authentication

-- 1. Make user_id nullable in profiles table
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop the foreign key constraint to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 3. Drop the unique constraint on user_id since it's no longer required
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- 4. Add unique constraint on email instead (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- 5. Update any existing RLS policies to work without user_id dependency
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Enable update for profile owners" ON profiles;

-- 6. Disable RLS completely for direct authentication
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- 8. Also ensure organizations table works with the new setup
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;

-- 9. Update user_events table
ALTER TABLE user_events DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_events TO authenticated;

-- 10. Update events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;

-- 11. Create a function to safely insert profiles without user_id
CREATE OR REPLACE FUNCTION insert_profile_direct_auth(
  p_email TEXT,
  p_password_hash TEXT,
  p_user_type TEXT DEFAULT 'student',
  p_dorm TEXT DEFAULT NULL,
  p_wing TEXT DEFAULT NULL,
  p_verification_code TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO profiles (
    email,
    password_hash,
    user_type,
    dorm,
    wing,
    verification_code,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_email,
    p_password_hash,
    p_user_type,
    p_dorm,
    p_wing,
    p_verification_code,
    p_status,
    NOW(),
    NOW()
  ) RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- 12. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION insert_profile_direct_auth TO anon;
GRANT EXECUTE ON FUNCTION insert_profile_direct_auth TO authenticated;

-- 13. Add comment explaining the change
COMMENT ON TABLE profiles IS 'User profiles table for direct authentication. user_id is nullable for direct auth users.';
COMMENT ON COLUMN profiles.user_id IS 'Optional foreign key to auth.users. Null for direct authentication users.';
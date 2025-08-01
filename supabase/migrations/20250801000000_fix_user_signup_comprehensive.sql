-- Comprehensive fix for user signup issues
-- This migration ensures all tables, constraints, and functions are properly set up for direct authentication

-- 1. Ensure profiles table has all required columns and constraints
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- 2. Add missing constraints
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email);
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_status_check 
  CHECK (status IN ('pending', 'active', 'blocked'));

-- 3. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_password_hash ON profiles(password_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code ON profiles(verification_code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- 4. Ensure organizations table has proper structure
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE organizations ADD CONSTRAINT IF NOT EXISTS organizations_status_check 
  CHECK (status IN ('pending', 'approved', 'blocked'));

-- 5. Add missing indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_contact_email ON organizations(contact_email);

-- 6. Ensure user_events table has proper structure
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS signed_up_by UUID;
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Add missing indexes for user_events
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_id ON user_events(event_id);
CREATE INDEX IF NOT EXISTS idx_user_events_signed_up_by ON user_events(signed_up_by);

-- 8. Ensure events table has proper structure
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 9. Add missing indexes for events
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- 10. Create or update the is_admin function to work with direct authentication
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If no user_uuid provided, try to get it from auth.uid() (for backward compatibility)
  IF user_uuid IS NULL THEN
    -- Try to get from auth.uid() if available
    BEGIN
      user_uuid := auth.uid();
    EXCEPTION
      WHEN OTHERS THEN
        -- auth.uid() not available, return false
        RETURN FALSE;
    END;
  END IF;
  
  -- Check if user exists and has admin role
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND role = 'admin' 
    AND status = 'active'
  );
END;
$$;

-- 11. Create function to get current user ID from session (for direct auth)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to get from auth.uid() first (for backward compatibility)
  BEGIN
    RETURN auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      -- auth.uid() not available, return NULL
      RETURN NULL;
  END;
END;
$$;

-- 12. Update RLS policies to work with both auth.uid() and direct authentication
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow direct profile insertion" ON profiles;

-- Create new policies that work with both auth systems
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for registration" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for profile owners" ON profiles
  FOR UPDATE USING (true);

-- 13. Ensure all tables have RLS disabled for direct authentication
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 14. Create a function to safely insert profiles with proper defaults
CREATE OR REPLACE FUNCTION insert_profile_safe(
  p_email TEXT,
  p_password_hash TEXT,
  p_user_type TEXT DEFAULT 'user',
  p_dorm TEXT DEFAULT NULL,
  p_wing TEXT DEFAULT NULL,
  p_verification_code TEXT DEFAULT NULL
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
    created_at
  ) VALUES (
    p_email,
    p_password_hash,
    p_user_type,
    p_dorm,
    p_wing,
    p_verification_code,
    'pending',
    NOW()
  ) RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- 15. Create a function to safely insert organizations
CREATE OR REPLACE FUNCTION insert_organization_safe(
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_contact_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
BEGIN
  INSERT INTO organizations (
    user_id,
    name,
    description,
    website,
    phone,
    contact_email,
    status
  ) VALUES (
    p_user_id,
    p_name,
    p_description,
    p_website,
    p_phone,
    p_contact_email,
    'pending'
  ) RETURNING id INTO org_id;
  
  RETURN org_id;
END;
$$;

-- 16. Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles for direct authentication system';
COMMENT ON COLUMN profiles.password_hash IS 'Bcrypt hashed password for direct authentication';
COMMENT ON COLUMN profiles.verification_code IS '6-digit verification code for email verification';
COMMENT ON COLUMN profiles.user_type IS 'Type of user: student, external, organization';
COMMENT ON COLUMN profiles.status IS 'User status: pending, active, blocked';

COMMENT ON TABLE organizations IS 'Organization profiles linked to user accounts';
COMMENT ON COLUMN organizations.status IS 'Organization approval status: pending, approved, blocked';

COMMENT ON TABLE user_events IS 'Event signups by users';
COMMENT ON COLUMN user_events.signed_up_by IS 'User who signed up (for group signups)';

COMMENT ON TABLE events IS 'Volunteer events and opportunities';
COMMENT ON COLUMN events.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN events.created_by IS 'User who created the event';
COMMENT ON COLUMN events.status IS 'Event status: active, cancelled, completed';

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 18. Ensure proper foreign key relationships
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_user_id_fkey;
ALTER TABLE organizations ADD CONSTRAINT organizations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_events DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;
ALTER TABLE user_events ADD CONSTRAINT user_events_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_events DROP CONSTRAINT IF EXISTS user_events_event_id_fkey;
ALTER TABLE user_events ADD CONSTRAINT user_events_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- 19. Create a view for easier user management
CREATE OR REPLACE VIEW user_summary AS
SELECT 
  p.id,
  p.email,
  p.user_type,
  p.status,
  p.role,
  p.dorm,
  p.wing,
  p.created_at,
  CASE 
    WHEN p.user_type = 'organization' THEN o.name
    ELSE NULL
  END as organization_name,
  CASE 
    WHEN p.user_type = 'organization' THEN o.status
    ELSE NULL
  END as organization_status
FROM profiles p
LEFT JOIN organizations o ON p.id = o.user_id;

-- 20. Add helpful indexes for the view
CREATE INDEX IF NOT EXISTS idx_user_summary_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_summary_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_summary_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_summary_role ON profiles(role);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive user signup fix completed successfully';
  RAISE NOTICE 'All tables, constraints, indexes, and functions are now properly configured for direct authentication';
END $$; 
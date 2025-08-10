-- Fix organizations table foreign key constraints to reference profiles instead of auth.users
-- This migration addresses the constraint violation error during organization registration

-- 1. First, clean up any orphaned data before adding constraints
-- Remove any organizations with user_id that doesn't exist in profiles
DELETE FROM organizations 
WHERE user_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- Set approved_by to NULL for any organizations where approved_by doesn't exist in profiles
UPDATE organizations 
SET approved_by = NULL 
WHERE approved_by IS NOT NULL 
  AND approved_by NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- 2. Drop existing foreign key constraints that reference auth.users
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_user_id_fkey;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_approved_by_fkey;

-- 3. Add new foreign key constraints that reference profiles table
ALTER TABLE organizations ADD CONSTRAINT organizations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE organizations ADD CONSTRAINT organizations_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_approved_by ON organizations(approved_by);

-- 5. Ensure RLS is disabled for organizations table (should already be done)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON organizations TO anon, authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Organizations foreign key constraints fixed successfully';
  RAISE NOTICE 'Organizations table now properly references profiles table instead of auth.users';
  RAISE NOTICE 'Orphaned organization records have been cleaned up';
END $$;
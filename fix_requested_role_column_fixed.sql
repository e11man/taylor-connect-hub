-- 🔧 COMPREHENSIVE FIX: Add missing requested_role column and update schema
-- This script fixes the "Could not find the 'requested_role' column of 'profiles' in the schema cache" error

-- Step 1: Add new leadership roles to user_role enum
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'faculty';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student_leader';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Commit the enum changes so they can be used
COMMIT;

-- Step 2: Add requested_role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS requested_role public.user_role;

-- Step 3: Add role column to profiles table if it doesn't exist (for compatibility)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'user';

-- Step 4: Update existing profiles to have proper role values
UPDATE public.profiles 
SET role = COALESCE(ur.role, 'user')
FROM public.user_roles ur 
WHERE profiles.user_id = ur.user_id 
AND profiles.role IS NULL;

-- Step 5: Create or update the is_leadership function
CREATE OR REPLACE FUNCTION public.is_leadership(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = $1 AND p.role IN ('pa','faculty','student_leader','admin')
  );
$$;

-- Step 6: Create or update the is_admin function (non-recursive)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
$$;

-- Step 7: Create or update the is_pa function (non-recursive)
CREATE OR REPLACE FUNCTION public.is_pa(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND (role = 'pa' OR role = 'faculty' OR role = 'student_leader' OR role = 'admin')
  );
$$;

-- Step 8: Force schema cache refresh by adding comments
COMMENT ON COLUMN public.profiles.requested_role IS 'Requested leadership role for approval: pa, faculty, student_leader';
COMMENT ON COLUMN public.profiles.role IS 'Current user role: user, pa, faculty, student_leader, admin';
COMMENT ON TABLE public.profiles IS 'User profiles with role and requested_role support';

-- Step 9: Verify the columns exist
DO $$
BEGIN
  -- Check if requested_role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'requested_role'
  ) THEN
    RAISE EXCEPTION 'requested_role column was not created successfully';
  END IF;
  
  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'role column was not created successfully';
  END IF;
  
  RAISE NOTICE '✅ All columns created successfully!';
END $$;

-- Step 10: Show sample data to verify
SELECT 
  'Current profiles table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 11: Show sample profile data
SELECT 
  'Sample profile data:' as info,
  id,
  email,
  role,
  requested_role,
  status
FROM public.profiles 
LIMIT 5;

-- ✅ FIX COMPLETE! 
-- The requested_role column has been added and your schema cache should now work properly.
-- Try creating an account again - the error should be resolved.

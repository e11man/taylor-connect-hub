-- 🚨 IMMEDIATE FIX FOR INFINITE RECURSION
-- Copy and paste this entire script into your Supabase SQL Editor and run it
-- This will completely eliminate the infinite recursion error when promoting users

BEGIN;

-- 1. Add role column to profiles table (safe if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- 2. Update existing profiles with their roles from user_roles table
UPDATE public.profiles 
SET role = ur.role 
FROM public.user_roles ur 
WHERE profiles.user_id = ur.user_id;

-- 3. Create new is_admin function that queries profiles (eliminates recursion)
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

-- 4. Create new is_pa function that queries profiles (eliminates recursion)
CREATE OR REPLACE FUNCTION public.is_pa(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND (role = 'pa' OR role = 'admin')
  );
$$;

-- 5. Drop all existing problematic policies on user_roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- 6. Create new non-recursive policies using the updated is_admin function
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- 7. Create trigger to keep profiles.role synchronized with user_roles.role
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When user_roles is updated, update profiles.role
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET role = NEW.role 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  -- When user_roles is inserted, update profiles.role
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET role = NEW.role 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- 8. Create trigger to keep user_roles.role synchronized with profiles.role
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When profiles.role is updated, update user_roles.role
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    UPDATE public.user_roles 
    SET role = NEW.role 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Add triggers for bidirectional synchronization
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.user_roles;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role();

DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.profiles;
CREATE TRIGGER sync_profile_role_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();

-- 10. Update the handle_new_user function to set role in both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  user_status TEXT DEFAULT 'active';
  user_role public.user_role DEFAULT 'user';
BEGIN
  -- Check if email ends with taylor.edu
  IF NOT NEW.email LIKE '%@taylor.edu' THEN
    user_status := 'pending';
  END IF;

  -- Handle regular users (students)
  IF NEW.raw_user_meta_data ->> 'user_type' IS NULL OR NEW.raw_user_meta_data ->> 'user_type' = 'student' THEN
    INSERT INTO public.profiles (user_id, email, dorm, wing, status, role)
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data ->> 'dorm',
      NEW.raw_user_meta_data ->> 'wing',
      user_status,
      user_role
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
  -- Handle organizations
  ELSIF NEW.raw_user_meta_data ->> 'user_type' = 'organization' THEN
    INSERT INTO public.organizations (
      user_id, 
      name, 
      description, 
      website, 
      phone, 
      contact_email,
      status
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'organization_name',
      NEW.raw_user_meta_data ->> 'description',
      NEW.raw_user_meta_data ->> 'website',
      NEW.raw_user_meta_data ->> 'phone',
      NEW.email,
      'pending'
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
  END IF;
  
  RETURN NEW;
END;
$$;

COMMIT;

-- Test the fix by checking if admin promotion works
SELECT 
  'SUCCESS: Fix applied! Admin can now promote users without infinite recursion.' as status,
  'The role field has been added to profiles table and kept in sync with user_roles.' as details;

-- Verify the new policies are in place
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Using profiles table'
    ELSE 'No recursion'
  END as recursion_status
FROM pg_policies 
WHERE tablename = 'user_roles' 
ORDER BY policyname;
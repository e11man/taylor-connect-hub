-- Debug and Fix User Creation Error Script
-- Run this script in Supabase SQL Editor to diagnose and fix the issue

-- 1. Check if the handle_new_user trigger exists and is properly set up
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check the profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check the user_roles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 4. Check the organizations table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 5. Fix the handle_new_user function to handle errors better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_status TEXT DEFAULT 'active';
BEGIN
  -- Log the incoming data for debugging
  RAISE NOTICE 'handle_new_user triggered for user %', NEW.email;
  RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Check if email ends with taylor.edu
  IF NOT NEW.email LIKE '%@taylor.edu' THEN
    user_status := 'pending';
  END IF;

  BEGIN
    -- Handle regular users (students and external)
    IF NEW.raw_user_meta_data ->> 'user_type' IS NULL 
       OR NEW.raw_user_meta_data ->> 'user_type' = 'student'
       OR NEW.raw_user_meta_data ->> 'user_type' = 'external' THEN
      
      -- Insert into profiles table
      INSERT INTO public.profiles (user_id, email, dorm, wing, status)
      VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'dorm', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'wing', ''),
        user_status
      );
      
      -- Create user role entry
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
      
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
        COALESCE(NEW.raw_user_meta_data ->> 'organization_name', 'Unknown Organization'),
        COALESCE(NEW.raw_user_meta_data ->> 'description', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'website', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
        NEW.email,
        'pending'
      );
      
      -- Create user role entry
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error
      RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
      -- Don't re-raise the exception to allow user creation to continue
  END;
  
  RETURN NEW;
END;
$$;

-- 6. Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 8. Check if there are any failed user creations in auth.users without corresponding profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    p.id as profile_id,
    ur.role as user_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE p.id IS NULL OR ur.role IS NULL
ORDER BY au.created_at DESC;

-- 9. Fix any orphaned users (users without profiles)
INSERT INTO public.profiles (user_id, email, dorm, wing, status)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'dorm', ''),
    COALESCE(au.raw_user_meta_data ->> 'wing', ''),
    CASE 
        WHEN au.email LIKE '%@taylor.edu' THEN 'active'
        ELSE 'pending'
    END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL
    AND (au.raw_user_meta_data ->> 'user_type' IS NULL 
         OR au.raw_user_meta_data ->> 'user_type' = 'student'
         OR au.raw_user_meta_data ->> 'user_type' = 'external');

-- 10. Fix any users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id,
    'user'
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role IS NULL;

-- 11. Test the function with sample data (DO NOT RUN IN PRODUCTION)
-- DO $$
-- DECLARE
--   test_user_id UUID := gen_random_uuid();
-- BEGIN
--   -- Simulate a user insertion
--   INSERT INTO auth.users (id, email, raw_user_meta_data)
--   VALUES (
--     test_user_id,
--     'test@example.com',
--     '{"user_type": "student", "dorm": "Test Dorm", "wing": "Test Wing"}'::jsonb
--   );
--   
--   -- Check if profile was created
--   IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = test_user_id) THEN
--     RAISE NOTICE 'Test passed: Profile created successfully';
--   ELSE
--     RAISE WARNING 'Test failed: Profile not created';
--   END IF;
--   
--   -- Clean up test data
--   DELETE FROM auth.users WHERE id = test_user_id;
-- END $$;
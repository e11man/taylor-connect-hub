-- Create admin user and set up admin role
-- This migration sets up an admin user for the system

-- First, let's create a function to create admin user if it doesn't exist
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@taylor.edu';
  
  -- If admin user doesn't exist, we'll create a profile entry for manual user creation
  -- Note: The actual user creation needs to be done through the auth system
  IF admin_user_id IS NULL THEN
    -- Insert a placeholder record that will be updated when the admin user signs up
    -- We'll use a special function to allow this
    INSERT INTO public.user_roles (user_id, role)
    SELECT gen_random_uuid(), 'admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE role = 'admin'
    );
    
    -- Log that admin setup is needed
    RAISE NOTICE 'Admin user needs to be created manually. Please create a user with email admin@taylor.edu through the Supabase dashboard.';
  ELSE
    -- Admin user exists, ensure they have admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
      
    -- Also ensure they have a profile
    INSERT INTO public.profiles (user_id, email, dorm, wing, status)
    VALUES (admin_user_id, 'admin@taylor.edu', 'Admin', 'Admin', 'active')
    ON CONFLICT (user_id)
    DO UPDATE SET
      status = 'active',
      updated_at = now();
      
    RAISE NOTICE 'Admin user setup completed for existing user.';
  END IF;
END;
$$;

-- Execute the setup function
SELECT setup_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION setup_admin_user();
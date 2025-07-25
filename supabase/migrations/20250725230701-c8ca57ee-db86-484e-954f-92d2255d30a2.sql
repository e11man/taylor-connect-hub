-- Create a fresh admin user with a different email to avoid the auth schema issues
-- We'll create the user entry in profiles and user_roles tables
-- Then provide instructions for manual user creation

-- Create a new admin profile entry
INSERT INTO public.profiles (user_id, email, dorm, wing, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin.fresh@taylor.edu',
  'Admin',
  'Admin',
  'active',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Get the user_id we just created
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'admin.fresh@taylor.edu' 
    LIMIT 1;
    
    -- Create the admin role for this user
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (admin_user_id, 'admin', now(), now())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        updated_at = now();
END $$;
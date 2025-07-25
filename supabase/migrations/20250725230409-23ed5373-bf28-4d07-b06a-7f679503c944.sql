-- Create a fresh admin user to avoid the auth schema NULL token issues
-- First, let's create the user in a way that avoids NULL token problems

-- We'll use the admin API to create a user, but first let's clean up any existing admin users
-- and create a fresh one via the application layer

-- For now, let's just ensure our user_roles table is ready
-- and create a backup admin user entry that we can assign to a new auth user

-- Create a test admin role entry that we can link to a new user
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Placeholder UUID
  'admin',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
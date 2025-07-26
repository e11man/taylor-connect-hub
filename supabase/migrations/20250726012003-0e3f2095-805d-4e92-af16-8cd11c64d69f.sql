-- Insert initial admin user for josh_ellman@taylor.edu
-- First, get the user_id for josh_ellman@taylor.edu from profiles
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user_id for josh_ellman@taylor.edu
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'josh_ellman@taylor.edu' 
    LIMIT 1;
    
    -- If user exists, make them admin
    IF admin_user_id IS NOT NULL THEN
        -- Insert or update their role to admin
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = now();
            
        RAISE NOTICE 'Admin role granted to user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User josh_ellman@taylor.edu not found in profiles table';
    END IF;
END $$;

-- Update RLS policies to handle the admin role check more reliably
-- First, improve the check_is_admin function to be more robust
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Add a unique constraint to prevent duplicate user roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);
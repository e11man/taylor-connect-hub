-- Fix missing role column in profiles table
-- This will add the role column and sync it with user_roles table

-- 1. Check if role column exists, if not add it
DO $$ 
BEGIN
    -- Check if the role column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        -- Add the role column
        ALTER TABLE public.profiles 
        ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';
        
        -- Update existing profiles with their roles from user_roles table
        UPDATE public.profiles 
        SET role = COALESCE(ur.role, 'user')
        FROM public.user_roles ur 
        WHERE profiles.user_id = ur.user_id;
        
        RAISE NOTICE 'Role column added to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
END $$;

-- 2. Ensure all profiles have roles from user_roles
UPDATE public.profiles 
SET role = ur.role 
FROM public.user_roles ur 
WHERE profiles.user_id = ur.user_id 
AND profiles.role != ur.role;

-- 3. Force schema cache refresh by commenting on the table
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, pa, or user - synchronized with user_roles table';
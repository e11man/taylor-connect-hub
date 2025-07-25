-- 🚨 URGENT SCHEMA FIX
-- Run this script FIRST to fix the schema cache issue

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
        
        -- Update existing profiles with their roles
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

-- 3. Verify the column exists and show sample data
SELECT 
    'Schema Check' as test,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'role';

-- 4. Show sample profiles data to confirm role column is populated
SELECT 
    'Data Sample' as test,
    user_id, 
    email, 
    role,
    status
FROM public.profiles 
LIMIT 5;

-- 5. Force schema cache refresh by commenting on the table
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, pa, or user - synchronized with user_roles table';

SELECT 'SUCCESS: Role column is now available in profiles table' as status;
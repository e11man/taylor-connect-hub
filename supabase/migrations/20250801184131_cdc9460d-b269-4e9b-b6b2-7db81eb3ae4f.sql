-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS verification_code text,
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'user';

-- Ensure role column exists and has correct type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'user';
    END IF;
END $$;
-- Add verification_code column to profiles table for email verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Add index on verification_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code ON profiles(verification_code);

-- Add user_type column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student';

-- Add status column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; 
-- Add password_hash column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add created_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email);

-- Remove auth.users dependency by dropping the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Update RLS policies to work with direct authentication
-- Drop existing policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new RLS policies that work with session-based auth
-- Note: These will be updated to work with custom session management
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for registration" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for profile owners" ON profiles
  FOR UPDATE USING (true);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add index on password_hash for faster authentication
CREATE INDEX IF NOT EXISTS idx_profiles_password_hash ON profiles(password_hash);

-- Update organizations table to ensure proper foreign key relationship
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_user_id_fkey;
ALTER TABLE organizations ADD CONSTRAINT organizations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
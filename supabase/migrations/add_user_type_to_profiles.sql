-- Add user_type column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student';

-- Add constraint to ensure valid user types
ALTER TABLE profiles ADD CONSTRAINT check_user_type 
  CHECK (user_type IN ('student', 'external', 'organization', 'admin'));

-- Update the admin user with correct user_type
UPDATE profiles 
SET user_type = 'admin'
WHERE email = 'admin@admin.com';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
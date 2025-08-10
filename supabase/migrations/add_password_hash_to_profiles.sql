-- Add password_hash column to profiles table for custom authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add verification_code column for email verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Update the admin user with a hashed password for 'admin123'
-- This is a bcrypt hash of 'admin123' with salt rounds 10
UPDATE profiles 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@admin.com';

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
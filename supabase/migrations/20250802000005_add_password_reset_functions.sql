-- Add password reset functions for direct authentication
-- This migration creates secure functions for password reset with verification codes

-- 1. Create a function to update password with reset code
CREATE OR REPLACE FUNCTION update_password_with_reset_code(
  p_email TEXT,
  p_reset_code TEXT,
  p_new_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  stored_code TEXT;
  code_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the user's reset code and timestamp
  SELECT id, verification_code, updated_at INTO user_id, stored_code, code_time
  FROM profiles
  WHERE email = p_email;
  
  -- If no user found, return false
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- If no reset code stored, return false
  IF stored_code IS NULL THEN
    RAISE EXCEPTION 'No reset code found';
  END IF;
  
  -- Check if the reset code matches
  IF stored_code != p_reset_code THEN
    RAISE EXCEPTION 'Invalid reset code';
  END IF;
  
  -- Check if the code has expired (10 minutes)
  IF code_time < (NOW() - INTERVAL '10 minutes') THEN
    RAISE EXCEPTION 'Reset code has expired';
  END IF;
  
  -- Update the password and clear the reset code
  UPDATE profiles
  SET password_hash = p_new_password_hash,
      verification_code = NULL,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- 2. Create a function to verify reset code without updating password
CREATE OR REPLACE FUNCTION verify_reset_code(
  p_email TEXT,
  p_reset_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_code TEXT;
  code_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the user's reset code and timestamp
  SELECT verification_code, updated_at INTO stored_code, code_time
  FROM profiles
  WHERE email = p_email;
  
  -- If no user found or no reset code, return false
  IF stored_code IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the reset code matches
  IF stored_code != p_reset_code THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the code has expired (10 minutes)
  IF code_time < (NOW() - INTERVAL '10 minutes') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 3. Create a function to clear reset code
CREATE OR REPLACE FUNCTION clear_reset_code(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear the reset code
  UPDATE profiles
  SET verification_code = NULL,
      updated_at = NOW()
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION update_password_with_reset_code(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_reset_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION clear_reset_code(TEXT) TO anon, authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION update_password_with_reset_code(TEXT, TEXT, TEXT) IS 'Update user password using reset code with expiration check';
COMMENT ON FUNCTION verify_reset_code(TEXT, TEXT) IS 'Verify reset code without updating password';
COMMENT ON FUNCTION clear_reset_code(TEXT) IS 'Clear reset code for user';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Password reset functions added for direct authentication';
END $$; 
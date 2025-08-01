-- Fix password update functionality for direct authentication
-- This migration creates secure functions for password updates

-- 1. Create a function to verify current password
CREATE OR REPLACE FUNCTION verify_user_password(
  p_user_id UUID,
  p_current_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM profiles
  WHERE id = p_user_id;
  
  -- If no user found or no password hash, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the password using bcrypt
  RETURN crypt(p_current_password, stored_hash) = stored_hash;
END;
$$;

-- 2. Create a function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
  new_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM profiles
  WHERE id = p_user_id;
  
  -- If no user found or no password hash, return false
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Verify the current password
  IF crypt(p_current_password, stored_hash) != stored_hash THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;
  
  -- Hash the new password
  new_hash := crypt(p_new_password, gen_salt('bf', 12));
  
  -- Update the password hash
  UPDATE profiles
  SET password_hash = new_hash, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- 3. Create a function to get user email for verification
CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN user_email;
END;
$$;

-- 4. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION verify_user_password(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_password(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO anon, authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION verify_user_password(UUID, TEXT) IS 'Verify a user password against stored hash';
COMMENT ON FUNCTION update_user_password(UUID, TEXT, TEXT) IS 'Safely update a user password with current password verification';
COMMENT ON FUNCTION get_user_email(UUID) IS 'Get user email for verification purposes';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Password update functions created successfully for direct authentication';
END $$; 
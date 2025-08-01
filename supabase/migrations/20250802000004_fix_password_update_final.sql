-- Final fix for password update functionality with bcrypt
-- This approach handles bcrypt verification on the client side

-- 1. Drop the previous functions
DROP FUNCTION IF EXISTS verify_user_password(UUID, TEXT);
DROP FUNCTION IF EXISTS update_user_password(UUID, TEXT);
DROP FUNCTION IF EXISTS verify_and_update_password(UUID, TEXT, TEXT);

-- 2. Create a function to get user password hash for verification
CREATE OR REPLACE FUNCTION get_user_password_hash(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM profiles
  WHERE id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN stored_hash;
END;
$$;

-- 3. Create a function to update user password (after client-side verification)
CREATE OR REPLACE FUNCTION update_user_password_hash(
  p_user_id UUID,
  p_new_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the password hash
  UPDATE profiles
  SET password_hash = p_new_password_hash, updated_at = now()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_user_password_hash(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_password_hash(UUID, TEXT) TO anon, authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION get_user_password_hash(UUID) IS 'Get user password hash for client-side bcrypt verification';
COMMENT ON FUNCTION update_user_password_hash(UUID, TEXT) IS 'Update user password with pre-hashed password after verification';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Password update functions finalized for bcrypt authentication';
END $$; 
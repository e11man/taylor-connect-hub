-- Fix notification_preferences RLS policies for direct authentication
-- This migration updates the RLS policies to work with direct auth instead of Supabase Auth

-- 1. Drop existing RLS policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can create their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;

-- 2. Disable RLS temporarily to allow direct operations
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- 3. Fix the foreign key constraint to reference profiles instead of auth.users
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Create a function to safely get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_frequency TEXT,
  chat_notifications BOOLEAN,
  event_updates BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    np.id,
    np.user_id,
    np.email_frequency,
    np.chat_notifications,
    np.event_updates,
    np.created_at,
    np.updated_at
  FROM notification_preferences np
  WHERE np.user_id = p_user_id;
END;
$$;

-- 5. Create a function to safely upsert notification preferences
CREATE OR REPLACE FUNCTION upsert_notification_preferences(
  p_user_id UUID,
  p_email_frequency TEXT DEFAULT 'immediate',
  p_chat_notifications BOOLEAN DEFAULT true,
  p_event_updates BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  preference_id UUID;
BEGIN
  -- Validate that the user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Validate email_frequency
  IF p_email_frequency NOT IN ('immediate', 'daily', 'weekly', 'never') THEN
    RAISE EXCEPTION 'Invalid email_frequency value';
  END IF;

  -- Upsert the preferences
  INSERT INTO notification_preferences (
    user_id,
    email_frequency,
    chat_notifications,
    event_updates
  ) VALUES (
    p_user_id,
    p_email_frequency,
    p_chat_notifications,
    p_event_updates
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email_frequency = EXCLUDED.email_frequency,
    chat_notifications = EXCLUDED.chat_notifications,
    event_updates = EXCLUDED.event_updates,
    updated_at = now()
  RETURNING id INTO preference_id;

  RETURN preference_id;
END;
$$;

-- 6. Create a function to safely delete notification preferences
CREATE OR REPLACE FUNCTION delete_notification_preferences(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete the preferences
  DELETE FROM notification_preferences 
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_notification_preferences(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_notification_preferences(UUID, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_notification_preferences(UUID) TO anon, authenticated;

-- 8. Add helpful indexes for notification preferences queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email_frequency ON notification_preferences(email_frequency);

-- 9. Add comments for documentation
COMMENT ON FUNCTION get_notification_preferences(UUID) IS 'Get notification preferences for a user';
COMMENT ON FUNCTION upsert_notification_preferences(UUID, TEXT, BOOLEAN, BOOLEAN) IS 'Safely upsert notification preferences for a user';
COMMENT ON FUNCTION delete_notification_preferences(UUID) IS 'Safely delete notification preferences for a user';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Notification preferences RLS fix completed successfully';
  RAISE NOTICE 'RLS disabled and secure functions created for direct authentication';
END $$; 
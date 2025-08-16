-- Add organization-specific notification preferences
-- Organizations already use the same auth.users table, so we can extend the existing notification_preferences table

-- Add new columns for organization-specific settings
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS volunteer_signups BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS volunteer_cancellations BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS system_updates BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the columns
COMMENT ON COLUMN public.notification_preferences.volunteer_signups IS 'Notify when volunteers sign up for organization events';
COMMENT ON COLUMN public.notification_preferences.volunteer_cancellations IS 'Notify when volunteers cancel their signups';
COMMENT ON COLUMN public.notification_preferences.weekly_summary IS 'Receive weekly summary of organization activities';
COMMENT ON COLUMN public.notification_preferences.system_updates IS 'Receive important system announcements and updates';

-- Update the upsert function to include new fields
CREATE OR REPLACE FUNCTION upsert_notification_preferences(
  p_user_id UUID,
  p_email_frequency TEXT DEFAULT 'immediate',
  p_chat_notifications BOOLEAN DEFAULT true,
  p_event_updates BOOLEAN DEFAULT true,
  p_volunteer_signups BOOLEAN DEFAULT true,
  p_volunteer_cancellations BOOLEAN DEFAULT true,
  p_weekly_summary BOOLEAN DEFAULT true,
  p_system_updates BOOLEAN DEFAULT true
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
    event_updates,
    volunteer_signups,
    volunteer_cancellations,
    weekly_summary,
    system_updates
  ) VALUES (
    p_user_id,
    p_email_frequency,
    p_chat_notifications,
    p_event_updates,
    p_volunteer_signups,
    p_volunteer_cancellations,
    p_weekly_summary,
    p_system_updates
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email_frequency = EXCLUDED.email_frequency,
    chat_notifications = EXCLUDED.chat_notifications,
    event_updates = EXCLUDED.event_updates,
    volunteer_signups = EXCLUDED.volunteer_signups,
    volunteer_cancellations = EXCLUDED.volunteer_cancellations,
    weekly_summary = EXCLUDED.weekly_summary,
    system_updates = EXCLUDED.system_updates,
    updated_at = now()
  RETURNING id INTO preference_id;

  RETURN preference_id;
END;
$$;

-- Update the get_notification_preferences function to include new fields
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email_frequency TEXT,
  chat_notifications BOOLEAN,
  event_updates BOOLEAN,
  volunteer_signups BOOLEAN,
  volunteer_cancellations BOOLEAN,
  weekly_summary BOOLEAN,
  system_updates BOOLEAN,
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
    np.volunteer_signups,
    np.volunteer_cancellations,
    np.weekly_summary,
    np.system_updates,
    np.created_at,
    np.updated_at
  FROM notification_preferences np
  WHERE np.user_id = p_user_id;
END;
$$;

-- Grant permissions for updated functions
GRANT EXECUTE ON FUNCTION upsert_notification_preferences(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_notification_preferences(UUID) TO anon, authenticated, service_role;
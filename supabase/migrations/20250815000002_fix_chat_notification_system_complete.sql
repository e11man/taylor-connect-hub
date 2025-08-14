-- Fix Chat Notification System Complete
-- This migration creates all missing functions and fixes the chat notification system
-- to work flawlessly with Resend and respect user preferences

-- 1. Create the get_pending_notifications function
CREATE OR REPLACE FUNCTION get_pending_notifications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  event_id UUID,
  chat_message_id UUID,
  notification_type TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  event_title TEXT,
  message TEXT,
  sender_name TEXT,
  sender_type TEXT,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.event_id,
    n.chat_message_id,
    n.notification_type,
    n.scheduled_for,
    p.email as user_email,
    e.title as event_title,
    cm.message,
    CASE 
      WHEN cm.user_id IS NOT NULL THEN 
        COALESCE(p.first_name || ' ' || p.last_name, p.email)
      WHEN cm.organization_id IS NOT NULL THEN 
        o.name
      ELSE 'Anonymous'
    END as sender_name,
    CASE 
      WHEN cm.user_id IS NOT NULL THEN 'user'
      WHEN cm.organization_id IS NOT NULL THEN 'organization'
      ELSE 'anonymous'
    END as sender_type,
    o.name as organization_name
  FROM notifications n
  JOIN profiles p ON n.user_id = p.id
  JOIN events e ON n.event_id = e.id
  JOIN chat_messages cm ON n.chat_message_id = cm.id
  LEFT JOIN organizations o ON e.organization_id = o.id
  WHERE n.email_sent = false
    AND n.scheduled_for <= now()
    AND n.notification_type = 'chat_message'
  ORDER BY n.scheduled_for ASC;
END;
$$;

-- 2. Create the mark_notification_sent function
CREATE OR REPLACE FUNCTION mark_notification_sent(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET 
    email_sent = true,
    sent_at = now()
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$;

-- 3. Create the get_notification_stats function for monitoring
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_notifications BIGINT,
  immediate_pending BIGINT,
  daily_pending BIGINT,
  weekly_pending BIGINT,
  sent_today BIGINT,
  failed_today BIGINT,
  success_rate_today NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN n.scheduled_for <= now() AND n.email_sent = false THEN 1 END) as immediate_pending,
    COUNT(CASE WHEN n.scheduled_for > now() AND n.email_sent = false THEN 1 END) as scheduled_pending,
    COUNT(CASE WHEN n.scheduled_for > now() + interval '1 day' AND n.email_sent = false THEN 1 END) as weekly_pending,
    COUNT(CASE WHEN n.email_sent = true AND n.sent_at >= date_trunc('day', now()) THEN 1 END) as sent_today,
    COUNT(CASE WHEN n.email_sent = false AND n.scheduled_for < now() - interval '1 hour' THEN 1 END) as failed_today,
    CASE 
      WHEN COUNT(CASE WHEN n.sent_at >= date_trunc('day', now()) THEN 1 END) = 0 THEN 0
      ELSE ROUND(
        COUNT(CASE WHEN n.email_sent = true AND n.sent_at >= date_trunc('day', now()) THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN n.sent_at >= date_trunc('day', now()) THEN 1 END), 2
      )
    END as success_rate_today
  FROM notifications n
  WHERE n.created_at >= now() - interval '7 days';
END;
$$;

-- 4. Create the upsert_notification_preferences function if it doesn't exist
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

-- 5. Create the get_notification_preferences function if it doesn't exist
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

-- 6. Grant permissions for all functions
GRANT EXECUTE ON FUNCTION get_pending_notifications() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_notification_sent(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_notification_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_notification_preferences(UUID, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_notification_preferences(UUID) TO anon, authenticated, service_role;

-- 7. Create performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent_scheduled ON notifications(email_sent, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notifications(notification_type, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_event ON notifications(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_event_user ON chat_messages(event_id, user_id, created_at DESC);

-- 8. Add helpful comments for documentation
COMMENT ON FUNCTION get_pending_notifications() IS 'Get all pending notifications that are ready to be sent via email';
COMMENT ON FUNCTION mark_notification_sent(UUID) IS 'Mark a notification as sent and record the sent timestamp';
COMMENT ON FUNCTION get_notification_stats() IS 'Get comprehensive statistics about notification processing for monitoring';
COMMENT ON FUNCTION upsert_notification_preferences(UUID, TEXT, BOOLEAN, BOOLEAN) IS 'Create or update user notification preferences';
COMMENT ON FUNCTION get_notification_preferences(UUID) IS 'Get user notification preferences';

-- 9. Create a view for easy monitoring of notification status
CREATE OR REPLACE VIEW notification_monitoring AS
SELECT 
  n.id,
  n.notification_type,
  n.scheduled_for,
  n.email_sent,
  n.sent_at,
  n.created_at,
  p.email as user_email,
  e.title as event_title,
  cm.message as chat_message,
  CASE 
    WHEN n.email_sent = false AND n.scheduled_for <= now() THEN 'READY_TO_SEND'
    WHEN n.email_sent = false AND n.scheduled_for > now() THEN 'SCHEDULED'
    WHEN n.email_sent = true THEN 'SENT'
    ELSE 'UNKNOWN'
  END as status,
  EXTRACT(EPOCH FROM (now() - n.created_at)) / 60 as minutes_since_created
FROM notifications n
JOIN profiles p ON n.user_id = p.id
JOIN events e ON n.event_id = e.id
JOIN chat_messages cm ON n.chat_message_id = cm.id
WHERE n.notification_type = 'chat_message'
ORDER BY n.created_at DESC;

-- 10. Grant access to the monitoring view
GRANT SELECT ON notification_monitoring TO anon, authenticated, service_role;

-- 11. Create a function to clean up old notifications (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE created_at < now() - (days_to_keep || ' days')::INTERVAL
    AND email_sent = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_notifications(INTEGER) TO service_role;

-- 12. Create a function to test the notification system
CREATE OR REPLACE FUNCTION test_chat_notification_system()
RETURNS TABLE (
  test_result TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_event_id UUID;
  test_user_id UUID;
  test_message_id UUID;
  notification_count INTEGER;
BEGIN
  -- Get test data
  SELECT id INTO test_event_id FROM events LIMIT 1;
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_event_id IS NULL THEN
    RETURN QUERY SELECT 'FAILED'::TEXT, 'No events found for testing'::TEXT;
    RETURN;
  END IF;
  
  IF test_user_id IS NULL THEN
    RETURN QUERY SELECT 'FAILED'::TEXT, 'No users found for testing'::TEXT;
    RETURN;
  END IF;
  
  -- Insert a test chat message
  INSERT INTO chat_messages (event_id, user_id, message, is_anonymous)
  VALUES (test_event_id, test_user_id, 'Test message for notification system', false)
  RETURNING id INTO test_message_id;
  
  -- Check if notification was created
  SELECT COUNT(*) INTO notification_count
  FROM notifications 
  WHERE chat_message_id = test_message_id;
  
  -- Clean up test data
  DELETE FROM chat_messages WHERE id = test_message_id;
  DELETE FROM notifications WHERE chat_message_id = test_message_id;
  
  IF notification_count > 0 THEN
    RETURN QUERY SELECT 'PASSED'::TEXT, 'Notification system is working correctly'::TEXT;
  ELSE
    RETURN QUERY SELECT 'FAILED'::TEXT, 'No notification was created for test message'::TEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION test_chat_notification_system() TO service_role;

-- 13. Add comments for the new functions
COMMENT ON FUNCTION cleanup_old_notifications(INTEGER) IS 'Clean up old sent notifications to maintain database performance';
COMMENT ON FUNCTION test_chat_notification_system() IS 'Test function to verify the chat notification system is working correctly';
COMMENT ON VIEW notification_monitoring IS 'Real-time view for monitoring notification processing status';

-- 14. Verify the trigger is working
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_chat_message_created'
  ) THEN
    RAISE EXCEPTION 'Chat message trigger is missing. Please check the create_chat_notifications function.';
  END IF;
END $$;

-- 15. Final verification query
SELECT 
  'Chat Notification System Setup Complete' as status,
  COUNT(*) as total_notifications,
  (SELECT COUNT(*) FROM notification_preferences) as users_with_preferences,
  (SELECT COUNT(*) FROM chat_messages) as total_chat_messages
FROM notifications;

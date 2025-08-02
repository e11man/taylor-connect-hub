-- Fix chat notification system for direct authentication
-- This migration updates the notification system to work with profiles table instead of auth.users

-- 1. Update notifications table to work with direct auth
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Update chat_messages table to work with direct auth
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Create a function to create notifications for new chat messages
CREATE OR REPLACE FUNCTION create_chat_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_sender_user_id UUID;
  v_sender_org_id UUID;
  v_user_preferences RECORD;
BEGIN
  -- Get the chat message details from the NEW record
  v_event_id := NEW.event_id;
  v_sender_user_id := NEW.user_id;
  v_sender_org_id := NEW.organization_id;
  
  -- Create notifications for all users signed up for the event (except the sender)
  FOR v_user_preferences IN
    SELECT 
      ue.user_id,
      COALESCE(np.email_frequency, 'immediate') as email_frequency,
      COALESCE(np.chat_notifications, true) as chat_notifications
    FROM user_events ue
    LEFT JOIN notification_preferences np ON np.user_id = ue.user_id
    WHERE ue.event_id = v_event_id 
      AND ue.user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    -- Only create notification if chat notifications are enabled
    IF v_user_preferences.chat_notifications THEN
      INSERT INTO notifications (
        user_id, 
        event_id, 
        chat_message_id, 
        notification_type, 
        scheduled_for
      ) VALUES (
        v_user_preferences.user_id,
        v_event_id,
        NEW.id,
        'chat_message',
        CASE 
          WHEN v_user_preferences.email_frequency = 'immediate' THEN now()
          WHEN v_user_preferences.email_frequency = 'daily' THEN 
            date_trunc('day', now()) + interval '1 day' + interval '9 hours'
          WHEN v_user_preferences.email_frequency = 'weekly' THEN 
            date_trunc('week', now()) + interval '1 week' + interval '9 hours'
          ELSE NULL
        END
      );
    END IF;
  END LOOP;
  
  -- Also notify the organization that created the event (if they're not the sender)
  IF v_sender_org_id IS NULL THEN
    INSERT INTO notifications (
              user_id, 
        event_id, 
        chat_message_id, 
        notification_type, 
        scheduled_for
      )
    SELECT 
      o.user_id,
      v_event_id,
      NEW.id,
      'chat_message',
      CASE 
        WHEN COALESCE(np.email_frequency, 'immediate') = 'immediate' THEN now()
        WHEN COALESCE(np.email_frequency, 'immediate') = 'daily' THEN 
          date_trunc('day', now()) + interval '1 day' + interval '9 hours'
        WHEN COALESCE(np.email_frequency, 'immediate') = 'weekly' THEN 
          date_trunc('week', now()) + interval '1 week' + interval '9 hours'
        ELSE NULL
      END
    FROM events e
    JOIN organizations o ON e.organization_id = o.id
    LEFT JOIN notification_preferences np ON np.user_id = o.user_id
    WHERE e.id = v_event_id 
      AND o.user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000')
      AND (COALESCE(np.chat_notifications, true) = true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create a trigger to automatically create notifications when a chat message is inserted
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;

CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notifications();

-- 5. Create a function to get pending notifications for processing
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
  sender_name TEXT
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
      WHEN cm.organization_id IS NOT NULL THEN 
        COALESCE(org.name, 'Organization')
      WHEN cm.user_id IS NOT NULL AND NOT cm.is_anonymous THEN 
        'Volunteer'
      ELSE 'Anonymous'
    END as sender_name
  FROM notifications n
  JOIN chat_messages cm ON n.chat_message_id = cm.id
  JOIN events e ON n.event_id = e.id
  JOIN profiles p ON n.user_id = p.id
  LEFT JOIN organizations org ON cm.organization_id = org.id
  WHERE n.sent_at IS NULL 
    AND n.scheduled_for <= now()
    AND n.notification_type = 'chat_message';
END;
$$;

-- 6. Create a function to mark notifications as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET sent_at = now(), email_sent = true
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$;

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION create_chat_notifications() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pending_notifications() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_sent(UUID) TO anon, authenticated;

-- 8. Add comments for documentation
COMMENT ON FUNCTION create_chat_notifications() IS 'Create notifications for new chat messages based on user preferences';
COMMENT ON FUNCTION get_pending_notifications() IS 'Get pending notifications that need to be sent';
COMMENT ON FUNCTION mark_notification_sent(UUID) IS 'Mark a notification as sent';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Chat notification system updated for direct authentication';
END $$; 
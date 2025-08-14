-- Fix get_pending_notifications function to work with actual profiles table structure

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
        p.email
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
  LEFT JOIN organizations o ON e.organization_id = cm.organization_id
  WHERE n.email_sent = false
    AND n.scheduled_for <= now()
    AND n.notification_type = 'chat_message'
  ORDER BY n.scheduled_for ASC;
END;
$$;

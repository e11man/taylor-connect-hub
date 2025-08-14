-- Fix Chat Notification Accuracy and Recipient Identification
-- This migration ensures the system accurately identifies all recipients and sends notifications properly

-- 1. Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
DROP FUNCTION IF EXISTS create_chat_notifications();

-- 2. Create an improved create_chat_notifications function
CREATE OR REPLACE FUNCTION create_chat_notifications()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  v_event_id UUID;
  v_sender_user_id UUID;
  v_sender_org_id UUID;
  v_org_user_id UUID;
  v_notification_count INTEGER := 0;
BEGIN
  -- Get the chat message details from the NEW record
  v_event_id := NEW.event_id;
  v_sender_user_id := NEW.user_id;
  v_sender_org_id := NEW.organization_id;
  
  -- Log the notification creation process
  RAISE NOTICE 'Creating notifications for chat message % in event % (sender: user=%, org=%)', 
    NEW.id, v_event_id, v_sender_user_id, v_sender_org_id;
  
  -- 1. Create notifications for all users signed up for the event (except the sender)
  INSERT INTO public.notifications (user_id, event_id, chat_message_id, notification_type, scheduled_for)
  SELECT 
    ue.user_id,
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
  FROM public.user_events ue
  LEFT JOIN public.notification_preferences np ON np.user_id = ue.user_id
  WHERE ue.event_id = v_event_id 
    AND ue.user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000')
    AND (COALESCE(np.chat_notifications, true) = true)
    AND (COALESCE(np.email_frequency, 'immediate') != 'never');
  
  GET DIAGNOSTICS v_notification_count = ROW_COUNT;
  RAISE NOTICE 'Created % notifications for event participants', v_notification_count;
  
  -- 2. Notify the organization that created the event (if they're not the sender)
  IF v_sender_org_id IS NULL THEN
    -- Get the organization user ID for the event
    SELECT o.user_id INTO v_org_user_id
    FROM public.events e
    JOIN public.organizations o ON o.id = e.organization_id
    WHERE e.id = v_event_id;
    
    IF v_org_user_id IS NOT NULL AND v_org_user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000') THEN
      -- Check organization's notification preferences
      INSERT INTO public.notifications (user_id, event_id, chat_message_id, notification_type, scheduled_for)
      SELECT 
        v_org_user_id,
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
      FROM public.notification_preferences np
      WHERE np.user_id = v_org_user_id
        AND (np.chat_notifications = true OR np.chat_notifications IS NULL)
        AND (np.email_frequency != 'never' OR np.email_frequency IS NULL);
      
      GET DIAGNOSTICS v_notification_count = ROW_COUNT;
      RAISE NOTICE 'Created % notifications for organization', v_notification_count;
    END IF;
  END IF;
  
  -- 3. Log final notification count
  SELECT COUNT(*) INTO v_notification_count
  FROM public.notifications 
  WHERE chat_message_id = NEW.id;
  
  RAISE NOTICE 'Total notifications created for chat message %: %', NEW.id, v_notification_count;
  
  RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_notifications();

-- 4. Create a function to test notification accuracy
CREATE OR REPLACE FUNCTION test_notification_accuracy(p_chat_message_id UUID)
RETURNS TABLE (
  test_result TEXT,
  expected_recipients INTEGER,
  actual_notifications INTEGER,
  recipient_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_sender_user_id UUID;
  v_sender_org_id UUID;
  v_expected_count INTEGER := 0;
  v_actual_count INTEGER := 0;
  v_recipient_list TEXT := '';
BEGIN
  -- Get chat message details
  SELECT event_id, user_id, organization_id 
  INTO v_event_id, v_sender_user_id, v_sender_org_id
  FROM chat_messages 
  WHERE id = p_chat_message_id;
  
  IF v_event_id IS NULL THEN
    RETURN QUERY SELECT 'ERROR'::TEXT, 0::INTEGER, 0::INTEGER, 'Chat message not found'::TEXT;
    RETURN;
  END IF;
  
  -- Count expected recipients (users signed up for event + organization, excluding sender)
  SELECT COUNT(*) INTO v_expected_count
  FROM (
    -- Event participants
    SELECT ue.user_id
    FROM user_events ue
    LEFT JOIN notification_preferences np ON np.user_id = ue.user_id
    WHERE ue.event_id = v_event_id 
      AND ue.user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000')
      AND (COALESCE(np.chat_notifications, true) = true)
      AND (COALESCE(np.email_frequency, 'immediate') != 'never')
    
    UNION
    
    -- Organization (if not sender)
    SELECT o.user_id
    FROM events e
    JOIN organizations o ON o.id = e.organization_id
    LEFT JOIN notification_preferences np ON np.user_id = o.user_id
    WHERE e.id = v_event_id 
      AND v_sender_org_id IS NULL
      AND o.user_id != COALESCE(v_sender_user_id, '00000000-0000-0000-0000-000000000000')
      AND (np.chat_notifications = true OR np.chat_notifications IS NULL)
      AND (np.email_frequency != 'never' OR np.email_frequency IS NULL)
  ) recipients;
  
  -- Count actual notifications created
  SELECT COUNT(*) INTO v_actual_count
  FROM notifications 
  WHERE chat_message_id = p_chat_message_id;
  
  -- Get recipient details
  SELECT string_agg(
    CASE 
      WHEN p.user_type = 'organization' THEN 'Org: ' || p.email
      ELSE 'User: ' || p.email
    END, 
    ', ' ORDER BY p.email
  ) INTO v_recipient_list
  FROM notifications n
  JOIN profiles p ON n.user_id = p.id
  WHERE n.chat_message_id = p_chat_message_id;
  
  -- Determine test result
  IF v_expected_count = v_actual_count THEN
    RETURN QUERY SELECT 
      'PASSED'::TEXT, 
      v_expected_count::INTEGER, 
      v_actual_count::INTEGER, 
      v_recipient_list::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'FAILED'::TEXT, 
      v_expected_count::INTEGER, 
      v_actual_count::INTEGER, 
      v_recipient_list::TEXT;
  END IF;
END;
$$;

-- 5. Create a function to manually trigger notifications for testing
CREATE OR REPLACE FUNCTION manually_trigger_notifications(p_event_id UUID, p_message_text TEXT)
RETURNS TABLE (
  message_id UUID,
  notifications_created INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_notification_count INTEGER;
BEGIN
  -- Insert a test chat message
  INSERT INTO chat_messages (event_id, user_id, message, is_anonymous)
  VALUES (p_event_id, NULL, p_message_text, true)
  RETURNING id INTO v_message_id;
  
  -- Count notifications created
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications 
  WHERE chat_message_id = v_message_id;
  
  RETURN QUERY SELECT 
    v_message_id::UUID, 
    v_notification_count::INTEGER, 
    'Test message created and notifications triggered'::TEXT;
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION test_notification_accuracy(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION manually_trigger_notifications(UUID, TEXT) TO service_role;

-- 7. Add helpful comments
COMMENT ON FUNCTION create_chat_notifications() IS 'Creates notifications for chat messages, ensuring all event participants and organization reps receive notifications';
COMMENT ON FUNCTION test_notification_accuracy(UUID) IS 'Tests if notifications were created correctly for a specific chat message';
COMMENT ON FUNCTION manually_trigger_notifications(UUID, TEXT) IS 'Manually triggers notifications for testing purposes';

-- 8. Verify the trigger is working
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_chat_message_created'
  ) THEN
    RAISE EXCEPTION 'Chat message trigger is missing. Please check the create_chat_notifications function.';
  END IF;
END $$;

-- 9. Final verification
SELECT 
  'Chat Notification Accuracy Fix Complete' as status,
  COUNT(*) as total_notifications,
  (SELECT COUNT(*) FROM chat_messages) as total_chat_messages,
  (SELECT COUNT(*) FROM user_events) as total_event_signups
FROM notifications;

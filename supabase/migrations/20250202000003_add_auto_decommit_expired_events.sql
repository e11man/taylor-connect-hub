-- Add automatic decommitment for users from expired events
-- This migration adds functionality to automatically remove user signups from events 
-- that have ended more than 1 hour ago

-- Create function to decommit users from expired events
CREATE OR REPLACE FUNCTION public.decommit_users_from_expired_events()
RETURNS TABLE (
  event_id UUID,
  event_title TEXT,
  decommitted_users_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  decommit_count INTEGER;
  total_decommitted INTEGER := 0;
BEGIN
  -- Find events that ended more than 1 hour ago and still have user signups
  FOR event_record IN 
    SELECT DISTINCT e.id, e.title, e.estimated_end_time
    FROM events e
    INNER JOIN user_events ue ON e.id = ue.event_id
    WHERE e.estimated_end_time IS NOT NULL 
      AND e.estimated_end_time < NOW() - INTERVAL '1 hour'
  LOOP
    -- Count how many users are signed up for this event
    SELECT COUNT(*) INTO decommit_count
    FROM user_events ue
    WHERE ue.event_id = event_record.id;
    
    -- Delete all user signups for this expired event
    DELETE FROM user_events 
    WHERE event_id = event_record.id;
    
    -- Return information about this event
    event_id := event_record.id;
    event_title := event_record.title;
    decommitted_users_count := decommit_count;
    total_decommitted := total_decommitted + decommit_count;
    
    RETURN NEXT;
  END LOOP;
  
  -- Log the total cleanup activity
  IF total_decommitted > 0 THEN
    RAISE NOTICE 'Auto-decommitted % users from expired events', total_decommitted;
  END IF;
  
  RETURN;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.decommit_users_from_expired_events() IS 'Automatically removes user signups from events that ended more than 1 hour ago. Returns details about which events were processed and how many users were decommitted.';

-- Create a simpler function that just returns the count for API use
CREATE OR REPLACE FUNCTION public.count_decommitted_users_from_expired_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_decommitted INTEGER := 0;
  decommit_count INTEGER;
  event_record RECORD;
BEGIN
  -- Find events that ended more than 1 hour ago and still have user signups
  FOR event_record IN 
    SELECT DISTINCT e.id
    FROM events e
    INNER JOIN user_events ue ON e.id = ue.event_id
    WHERE e.estimated_end_time IS NOT NULL 
      AND e.estimated_end_time < NOW() - INTERVAL '1 hour'
  LOOP
    -- Count how many users are signed up for this event
    SELECT COUNT(*) INTO decommit_count
    FROM user_events ue
    WHERE ue.event_id = event_record.id;
    
    -- Delete all user signups for this expired event
    DELETE FROM user_events 
    WHERE event_id = event_record.id;
    
    total_decommitted := total_decommitted + decommit_count;
  END LOOP;
  
  RETURN total_decommitted;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.count_decommitted_users_from_expired_events() IS 'Automatically removes user signups from events that ended more than 1 hour ago and returns the total count of decommitted users.';

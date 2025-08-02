-- Fix Statistics System - Ensure proper calculation and updates
-- This migration ensures statistics are calculated correctly from real data

-- First, ensure the content table has the statistics entries
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Update the hours calculation function to be more accurate
CREATE OR REPLACE FUNCTION public.update_hours_contributed()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COALESCE(SUM(
      GREATEST(1, CEILING(
        EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
      ))
    ), 0)::TEXT
    FROM public.user_events ue
    JOIN public.events e ON e.id = ue.event_id
    WHERE e.arrival_time IS NOT NULL 
      AND e.estimated_end_time IS NOT NULL
      AND e.estimated_end_time > e.arrival_time
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the active volunteers function to count unique users who have signed up for events
CREATE OR REPLACE FUNCTION public.update_active_volunteers_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT ue.user_id)::TEXT
    FROM public.user_events ue
    JOIN public.profiles p ON p.user_id = ue.user_id
    WHERE p.status = 'active'
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the partner organizations function to count approved organizations
CREATE OR REPLACE FUNCTION public.update_partner_organizations_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT e.organization_id)::TEXT
    FROM public.events e
    JOIN public.organizations o ON o.id = e.organization_id
    WHERE o.status = 'approved'
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_active_volunteers ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_hours_contributed_user_events ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_hours_contributed_events ON public.events;
DROP TRIGGER IF EXISTS trigger_update_partner_organizations ON public.events;

-- Create triggers for user_events changes
CREATE TRIGGER trigger_update_active_volunteers
  AFTER INSERT OR DELETE ON public.user_events
  FOR EACH ROW EXECUTE FUNCTION public.update_active_volunteers_count();

CREATE TRIGGER trigger_update_hours_contributed_user_events
  AFTER INSERT OR DELETE ON public.user_events
  FOR EACH ROW EXECUTE FUNCTION public.update_hours_contributed();

-- Create triggers for events changes
CREATE TRIGGER trigger_update_hours_contributed_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_hours_contributed();

CREATE TRIGGER trigger_update_partner_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_organizations_count();

-- Create triggers for profiles changes (when user status changes)
CREATE TRIGGER trigger_update_active_volunteers_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_active_volunteers_count();

-- Create triggers for organizations changes (when organization status changes)
CREATE TRIGGER trigger_update_partner_organizations_status
  AFTER UPDATE ON public.organizations
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_partner_organizations_count();

-- Initialize the counts with current data
UPDATE public.content 
SET value = (
  SELECT COUNT(DISTINCT ue.user_id)::TEXT
  FROM public.user_events ue
  JOIN public.profiles p ON p.user_id = ue.user_id
  WHERE p.status = 'active'
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';

UPDATE public.content 
SET value = (
  SELECT COALESCE(SUM(
    GREATEST(1, CEILING(
      EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
    ))
  ), 0)::TEXT
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  WHERE e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL
    AND e.estimated_end_time > e.arrival_time
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed';

UPDATE public.content 
SET value = (
  SELECT COUNT(DISTINCT e.organization_id)::TEXT
  FROM public.events e
  JOIN public.organizations o ON o.id = e.organization_id
  WHERE o.status = 'approved'
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';

-- Create a function to manually refresh all statistics
CREATE OR REPLACE FUNCTION public.refresh_all_statistics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Refresh active volunteers
  PERFORM public.update_active_volunteers_count();
  
  -- Refresh hours contributed
  PERFORM public.update_hours_contributed();
  
  -- Refresh partner organizations
  PERFORM public.update_partner_organizations_count();
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.refresh_all_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_statistics() TO anon; 
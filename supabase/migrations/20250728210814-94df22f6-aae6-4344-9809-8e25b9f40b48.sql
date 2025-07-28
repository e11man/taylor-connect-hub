-- Drop existing database functions for homepage stats
DROP FUNCTION IF EXISTS public.get_active_volunteers_count();
DROP FUNCTION IF EXISTS public.get_hours_contributed();
DROP FUNCTION IF EXISTS public.get_partner_organizations_count();
DROP FUNCTION IF EXISTS public.get_homepage_stats();

-- Insert homepage statistics into content table
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET
value = EXCLUDED.value;

-- Function to update active volunteers count
CREATE OR REPLACE FUNCTION public.update_active_volunteers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content 
    SET value = (
      SELECT COUNT(DISTINCT user_id)::TEXT
      FROM public.user_events
    )
    WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content 
    SET value = (
      SELECT COUNT(DISTINCT user_id)::TEXT
      FROM public.user_events
    )
    WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update hours contributed
CREATE OR REPLACE FUNCTION public.update_hours_contributed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COALESCE(SUM(
      CEILING(
        EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
      )
    ), 0)::TEXT
    FROM public.user_events ue
    JOIN public.events e ON e.id = ue.event_id
    WHERE e.arrival_time IS NOT NULL 
      AND e.estimated_end_time IS NOT NULL
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed';
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update partner organizations count
CREATE OR REPLACE FUNCTION public.update_partner_organizations_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT organization_id)::TEXT
    FROM public.events
    WHERE organization_id IS NOT NULL
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Initialize the counts with current data
UPDATE public.content 
SET value = (
  SELECT COUNT(DISTINCT user_id)::TEXT
  FROM public.user_events
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';

UPDATE public.content 
SET value = (
  SELECT COALESCE(SUM(
    CEILING(
      EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
    )
  ), 0)::TEXT
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  WHERE e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed';

UPDATE public.content 
SET value = (
  SELECT COUNT(DISTINCT organization_id)::TEXT
  FROM public.events
  WHERE organization_id IS NOT NULL
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
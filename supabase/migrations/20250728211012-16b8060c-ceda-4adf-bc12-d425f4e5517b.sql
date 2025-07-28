-- Fix security warnings by setting search_path for new functions
CREATE OR REPLACE FUNCTION public.update_active_volunteers_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

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
$$;

CREATE OR REPLACE FUNCTION public.update_partner_organizations_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;
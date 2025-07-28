-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.get_active_volunteers_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_events;
$$;

CREATE OR REPLACE FUNCTION public.get_hours_contributed()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(
    CEILING(
      EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
    )
  ), 0)::INTEGER
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  WHERE e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_organizations_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(DISTINCT organization_id)::INTEGER
  FROM public.events
  WHERE organization_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS TABLE(
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  partner_organizations INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    get_active_volunteers_count(),
    get_hours_contributed(),
    get_partner_organizations_count();
$$;
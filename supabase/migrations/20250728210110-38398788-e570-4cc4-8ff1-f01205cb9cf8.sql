-- Add arrival_time and estimated_end_time to events table
ALTER TABLE public.events 
ADD COLUMN arrival_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_end_time TIMESTAMP WITH TIME ZONE;

-- Create function to calculate active volunteers
CREATE OR REPLACE FUNCTION public.get_active_volunteers_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_events;
$$;

-- Create function to calculate hours contributed
CREATE OR REPLACE FUNCTION public.get_hours_contributed()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
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

-- Create function to get partner organizations count
CREATE OR REPLACE FUNCTION public.get_partner_organizations_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT organization_id)::INTEGER
  FROM public.events
  WHERE organization_id IS NOT NULL;
$$;

-- Create function to get all stats at once
CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS TABLE(
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  partner_organizations INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    get_active_volunteers_count(),
    get_hours_contributed(),
    get_partner_organizations_count();
$$;
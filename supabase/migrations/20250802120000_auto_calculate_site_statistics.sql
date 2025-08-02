-- Auto-calculate site statistics with manual override capability
-- This migration creates functions and triggers to automatically update site statistics
-- while allowing manual adjustments to be preserved

-- First, let's update the site_stats table to support both calculated and manual values
ALTER TABLE public.site_stats 
ADD COLUMN IF NOT EXISTS calculated_value INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_override INTEGER,
ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to calculate active volunteers (unique users who signed up for events)
CREATE OR REPLACE FUNCTION public.calculate_active_volunteers()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_events;
$$;

-- Create function to calculate hours contributed based on event durations
CREATE OR REPLACE FUNCTION public.calculate_hours_contributed()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN e.arrival_time IS NOT NULL AND e.estimated_end_time IS NOT NULL THEN
        CEILING(EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600)
      ELSE 2 -- Default 2 hours if no time specified
    END
  ), 0)::INTEGER
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id;
$$;

-- Create function to calculate partner organizations count
CREATE OR REPLACE FUNCTION public.calculate_partner_organizations()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT organization_id)::INTEGER
  FROM public.events
  WHERE organization_id IS NOT NULL;
$$;

-- Create function to update all site statistics
CREATE OR REPLACE FUNCTION public.update_site_statistics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update active volunteers
  UPDATE public.site_stats 
  SET 
    calculated_value = public.calculate_active_volunteers(),
    last_calculated_at = now()
  WHERE stat_type = 'active_volunteers';
  
  -- Update hours contributed
  UPDATE public.site_stats 
  SET 
    calculated_value = public.calculate_hours_contributed(),
    last_calculated_at = now()
  WHERE stat_type = 'hours_contributed';
  
  -- Update partner organizations
  UPDATE public.site_stats 
  SET 
    calculated_value = public.calculate_partner_organizations(),
    last_calculated_at = now()
  WHERE stat_type = 'partner_organizations';
END;
$$;

-- Create function to get the display value (manual override if exists, otherwise calculated)
CREATE OR REPLACE FUNCTION public.get_stat_display_value(stat_type_param TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(manual_override, calculated_value)
  FROM public.site_stats
  WHERE stat_type = stat_type_param;
$$;

-- Create function to get all statistics with both calculated and display values
CREATE OR REPLACE FUNCTION public.get_all_site_statistics()
RETURNS TABLE(
  stat_type TEXT,
  calculated_value INTEGER,
  manual_override INTEGER,
  display_value INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    stat_type,
    calculated_value,
    manual_override,
    COALESCE(manual_override, calculated_value) as display_value,
    last_calculated_at
  FROM public.site_stats
  ORDER BY stat_type;
$$;

-- Create trigger function to update statistics when user_events changes
CREATE OR REPLACE FUNCTION public.trigger_update_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update statistics when user_events table changes
  PERFORM public.update_site_statistics();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function to update statistics when events change
CREATE OR REPLACE FUNCTION public.trigger_update_event_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update statistics when events table changes (affects hours calculation)
  PERFORM public.update_site_statistics();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_statistics_on_user_events ON public.user_events;
CREATE TRIGGER update_statistics_on_user_events
  AFTER INSERT OR UPDATE OR DELETE ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_statistics();

DROP TRIGGER IF EXISTS update_statistics_on_events ON public.events;
CREATE TRIGGER update_statistics_on_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_event_statistics();

-- Initialize the statistics with current calculated values
SELECT public.update_site_statistics();

-- Create RLS policies for the new functions
-- Allow public read access to statistics
GRANT EXECUTE ON FUNCTION public.get_all_site_statistics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_stat_display_value(TEXT) TO anon;

-- Allow authenticated users to read statistics
GRANT EXECUTE ON FUNCTION public.get_all_site_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stat_display_value(TEXT) TO authenticated;

-- Allow admins to update manual overrides
CREATE POLICY "Admins can update site statistics" 
ON public.site_stats 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Allow public to read site statistics
CREATE POLICY "Public can read site statistics" 
ON public.site_stats 
FOR SELECT 
USING (true); 
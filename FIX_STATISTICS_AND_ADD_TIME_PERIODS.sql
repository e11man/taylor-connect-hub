-- FIX STATISTICS SYSTEM AND ADD TIME PERIOD FILTERING
-- Run this script in Supabase SQL Editor to fix statistics and add time period capabilities

-- First, ensure the content table has the statistics entries
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Create a new statistics table for time period data
CREATE TABLE IF NOT EXISTS public.statistics_time_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  active_volunteers INTEGER DEFAULT 0,
  hours_contributed INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  signups_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_type, period_start, period_end)
);

-- Enable RLS on the new table
ALTER TABLE public.statistics_time_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for the statistics table
CREATE POLICY "Allow read access to statistics" ON public.statistics_time_periods
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to statistics" ON public.statistics_time_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

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

-- Function to calculate statistics for a specific time period
CREATE OR REPLACE FUNCTION public.calculate_statistics_for_period(
  p_period_type TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  events_count INTEGER,
  signups_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Active volunteers (unique users who signed up for events in this period)
    COUNT(DISTINCT ue.user_id)::INTEGER as active_volunteers,
    
    -- Hours contributed (based on event duration)
    COALESCE(SUM(
      GREATEST(1, CEILING(
        EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
      ))
    ), 0)::INTEGER as hours_contributed,
    
    -- Events count
    COUNT(DISTINCT e.id)::INTEGER as events_count,
    
    -- Signups count
    COUNT(ue.id)::INTEGER as signups_count
    
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  JOIN public.profiles p ON p.user_id = ue.user_id
  WHERE ue.signed_up_at::DATE BETWEEN p_start_date AND p_end_date
    AND p.status = 'active'
    AND e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL
    AND e.estimated_end_time > e.arrival_time;
END;
$$;

-- Function to get statistics for different time periods
CREATE OR REPLACE FUNCTION public.get_statistics_by_period(
  p_period_type TEXT DEFAULT 'yearly'
)
RETURNS TABLE(
  period_start DATE,
  period_end DATE,
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  events_count INTEGER,
  signups_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  start_date DATE;
  end_date DATE;
  period_interval INTERVAL;
BEGIN
  -- Set interval based on period type
  CASE p_period_type
    WHEN 'daily' THEN period_interval := INTERVAL '1 day';
    WHEN 'weekly' THEN period_interval := INTERVAL '1 week';
    WHEN 'monthly' THEN period_interval := INTERVAL '1 month';
    WHEN 'yearly' THEN period_interval := INTERVAL '1 year';
    ELSE period_interval := INTERVAL '1 year';
  END CASE;
  
  -- Calculate start and end dates for the last 12 periods
  FOR i IN 0..11 LOOP
    start_date := current_date - (period_interval * i);
    end_date := start_date + period_interval - INTERVAL '1 day';
    
    RETURN QUERY
    SELECT 
      start_date,
      end_date,
      stats.active_volunteers,
      stats.hours_contributed,
      stats.events_count,
      stats.signups_count
    FROM public.calculate_statistics_for_period(p_period_type, start_date, end_date) stats;
  END LOOP;
END;
$$;

-- Function to get current year statistics
CREATE OR REPLACE FUNCTION public.get_current_year_statistics()
RETURNS TABLE(
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  events_count INTEGER,
  signups_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ue.user_id)::INTEGER as active_volunteers,
    COALESCE(SUM(
      GREATEST(1, CEILING(
        EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
      ))
    ), 0)::INTEGER as hours_contributed,
    COUNT(DISTINCT e.id)::INTEGER as events_count,
    COUNT(ue.id)::INTEGER as signups_count
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  JOIN public.profiles p ON p.user_id = ue.user_id
  WHERE EXTRACT(YEAR FROM ue.signed_up_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND p.status = 'active'
    AND e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL
    AND e.estimated_end_time > e.arrival_time;
END;
$$;

-- Function to get current month statistics
CREATE OR REPLACE FUNCTION public.get_current_month_statistics()
RETURNS TABLE(
  active_volunteers INTEGER,
  hours_contributed INTEGER,
  events_count INTEGER,
  signups_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ue.user_id)::INTEGER as active_volunteers,
    COALESCE(SUM(
      GREATEST(1, CEILING(
        EXTRACT(EPOCH FROM (e.estimated_end_time - e.arrival_time)) / 3600
      ))
    ), 0)::INTEGER as hours_contributed,
    COUNT(DISTINCT e.id)::INTEGER as events_count,
    COUNT(ue.id)::INTEGER as signups_count
  FROM public.user_events ue
  JOIN public.events e ON e.id = ue.event_id
  JOIN public.profiles p ON p.user_id = ue.user_id
  WHERE EXTRACT(YEAR FROM ue.signed_up_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM ue.signed_up_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND p.status = 'active'
    AND e.arrival_time IS NOT NULL 
    AND e.estimated_end_time IS NOT NULL
    AND e.estimated_end_time > e.arrival_time;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_active_volunteers ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_hours_contributed_user_events ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_hours_contributed_events ON public.events;
DROP TRIGGER IF EXISTS trigger_update_partner_organizations ON public.events;
DROP TRIGGER IF EXISTS trigger_update_active_volunteers_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_partner_organizations_status ON public.organizations;

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
GRANT EXECUTE ON FUNCTION public.get_statistics_by_period(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_statistics_by_period(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_year_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_year_statistics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_month_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_month_statistics() TO anon;

-- Insert some sample time period data for testing
INSERT INTO public.statistics_time_periods (period_type, period_start, period_end, active_volunteers, hours_contributed, events_count, signups_count)
SELECT 
  'monthly',
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, 11)),
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, 11)) + INTERVAL '1 month' - INTERVAL '1 day',
  0,
  0,
  0,
  0
ON CONFLICT (period_type, period_start, period_end) DO NOTHING;

-- Show current statistics
SELECT 
  'Current Statistics' as info,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers') as active_volunteers,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed') as hours_contributed,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations') as partner_organizations;

-- Show current year statistics
SELECT 'Current Year Statistics' as info, * FROM public.get_current_year_statistics();

-- Show current month statistics  
SELECT 'Current Month Statistics' as info, * FROM public.get_current_month_statistics(); 
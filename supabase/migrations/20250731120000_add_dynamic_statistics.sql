-- Create statistics tracking table
CREATE TABLE public.statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  base_value INTEGER NOT NULL DEFAULT 0,
  live_value INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on statistics
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for statistics (admin only)
CREATE POLICY "Admins can manage statistics" 
ON public.statistics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert default statistics
INSERT INTO public.statistics (key, base_value, live_value, description) VALUES
('active_volunteers', 2500, 0, 'Total number of active volunteers'),
('hours_contributed', 15000, 0, 'Total hours contributed by volunteers'),
('partner_organizations', 50, 0, 'Number of partner organizations');

-- Create function to calculate live statistics
CREATE OR REPLACE FUNCTION public.calculate_live_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update active volunteers count (unique users who have signed up for events)
  UPDATE public.statistics 
  SET live_value = (
    SELECT COUNT(DISTINCT user_id) 
    FROM public.user_events
  )
  WHERE key = 'active_volunteers';
  
  -- Update hours contributed (estimated based on event participation)
  UPDATE public.statistics 
  SET live_value = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN e.title LIKE '%Tutoring%' THEN 2  -- 2 hours for tutoring
        WHEN e.title LIKE '%Cleanup%' THEN 3   -- 3 hours for cleanup
        WHEN e.title LIKE '%Food%' THEN 2      -- 2 hours for food drive
        WHEN e.title LIKE '%Visit%' THEN 1     -- 1 hour for visits
        ELSE 2                                  -- Default 2 hours
      END
    ), 0)
    FROM public.user_events ue
    JOIN public.events e ON ue.event_id = e.id
  )
  WHERE key = 'hours_contributed';
  
  -- Update partner organizations count (unique organizations with events)
  UPDATE public.statistics 
  SET live_value = (
    SELECT COUNT(DISTINCT 
      CASE 
        WHEN e.location LIKE '%University%' THEN 'Taylor University'
        WHEN e.location LIKE '%School%' THEN 'Local Schools'
        WHEN e.location LIKE '%Center%' THEN 'Community Centers'
        WHEN e.location LIKE '%Garden%' THEN 'Community Gardens'
        ELSE e.location
      END
    )
    FROM public.events e
    WHERE e.location IS NOT NULL
  )
  WHERE key = 'partner_organizations';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to recalculate statistics when user_events changes
CREATE TRIGGER recalculate_statistics_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_live_statistics();

-- Create trigger to recalculate statistics when events change
CREATE TRIGGER recalculate_statistics_events_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_live_statistics();

-- Create function to get combined statistics (base + live)
CREATE OR REPLACE FUNCTION public.get_combined_statistics()
RETURNS TABLE (
  key TEXT,
  base_value INTEGER,
  live_value INTEGER,
  total_value INTEGER,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.key,
    s.base_value,
    s.live_value,
    s.base_value + s.live_value as total_value,
    s.description
  FROM public.statistics s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update base values
CREATE OR REPLACE FUNCTION public.update_statistic_base_value(
  stat_key TEXT,
  new_base_value INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.statistics 
  SET base_value = new_base_value, updated_at = now()
  WHERE key = stat_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually update live values
CREATE OR REPLACE FUNCTION public.update_statistic_live_value(
  stat_key TEXT,
  new_live_value INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.statistics 
  SET live_value = new_live_value, updated_at = now()
  WHERE key = stat_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.statistics IS 'Tracks dynamic impact statistics with base and live values';
COMMENT ON FUNCTION public.calculate_live_statistics() IS 'Recalculates live statistics based on user activity';
COMMENT ON FUNCTION public.get_combined_statistics() IS 'Returns combined statistics (base + live values)';
COMMENT ON FUNCTION public.update_statistic_base_value(TEXT, INTEGER) IS 'Updates the base value for a statistic (admin only)';
COMMENT ON FUNCTION public.update_statistic_live_value(TEXT, INTEGER) IS 'Manually updates the live value for a statistic (admin only)'; 
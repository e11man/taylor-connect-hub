-- Create site_stats table for automatic statistics calculation
-- Run this in the Supabase SQL Editor

-- Create site_stats table
CREATE TABLE IF NOT EXISTS public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL UNIQUE,
  calculated_value INTEGER NOT NULL DEFAULT 0,
  manual_override INTEGER,
  confirmed_total INTEGER NOT NULL DEFAULT 0,
  current_estimate INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read site statistics" 
ON public.site_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update site statistics" 
ON public.site_stats 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Insert initial data
INSERT INTO public.site_stats (stat_type, calculated_value, manual_override, confirmed_total, current_estimate) VALUES
  ('active_volunteers', 0, NULL, 2500, 2500),
  ('hours_contributed', 0, NULL, 15000, 15000),
  ('partner_organizations', 0, NULL, 50, 50)
ON CONFLICT (stat_type) DO NOTHING;

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_all_site_statistics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_site_statistics() TO authenticated;

-- Test the function
SELECT 'Testing get_all_site_statistics function...' as status;
SELECT public.get_all_site_statistics(); 
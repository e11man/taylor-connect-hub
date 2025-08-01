-- Update site_stats table to support both confirmed_total and current_estimate
-- First, drop the existing table if it exists (since we're changing the schema)
DROP TABLE IF EXISTS public.site_stats CASCADE;

-- Create the updated site_stats table
CREATE TABLE public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL UNIQUE,
  confirmed_total INTEGER NOT NULL DEFAULT 0,
  current_estimate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on site_stats
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for site_stats
-- Public can read statistics
CREATE POLICY "Anyone can view statistics" 
ON public.site_stats 
FOR SELECT 
USING (true);

-- Only admins can update statistics
CREATE POLICY "Only admins can update statistics" 
ON public.site_stats 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Only admins can insert statistics
CREATE POLICY "Only admins can insert statistics" 
ON public.site_stats 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_stats_updated_at
  BEFORE UPDATE ON public.site_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default statistics with both confirmed and estimate values
INSERT INTO public.site_stats (stat_type, confirmed_total, current_estimate) VALUES
  ('active_volunteers', 2500, 2500),
  ('hours_contributed', 5000, 5000),
  ('partner_organizations', 50, 50)
ON CONFLICT (stat_type) DO NOTHING;
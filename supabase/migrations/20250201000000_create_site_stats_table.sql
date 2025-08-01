-- Create site_stats table for storing confirmed statistics
CREATE TABLE IF NOT EXISTS public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_name TEXT NOT NULL UNIQUE,
  value INTEGER NOT NULL DEFAULT 0,
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

-- Insert default statistics
INSERT INTO public.site_stats (stat_name, value) VALUES
  ('active_volunteers', 2500),
  ('hours_contributed', 5000),
  ('partner_organizations', 50)
ON CONFLICT (stat_name) DO NOTHING;
-- Update active volunteers calculation to count profiles instead of user_events
-- This changes the definition to count all users in the profiles table

-- Update the function to calculate active volunteers (total count of profiles)
CREATE OR REPLACE FUNCTION public.calculate_active_volunteers()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles;
$$;

-- Update the trigger function to work with profiles table changes
CREATE OR REPLACE FUNCTION public.update_active_volunteers_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.profiles
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_active_volunteers ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_active_volunteers_profiles ON public.profiles;

-- Create new trigger on profiles table
CREATE TRIGGER trigger_update_active_volunteers_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_active_volunteers_count();

-- Update the existing statistics to reflect the new calculation
UPDATE public.site_stats 
SET 
  calculated_value = public.calculate_active_volunteers(),
  last_calculated_at = now()
WHERE stat_type = 'active_volunteers';

-- Also update the content table for the homepage display
UPDATE public.content 
SET value = (
  SELECT COUNT(*)::TEXT
  FROM public.profiles
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
-- Fix Active Volunteers Count to Include ALL Users
-- This migration updates the active volunteers calculation to count all users in the system
-- instead of just those who have signed up for events
--
-- HOW IT WORKS:
-- 1. Counts ONLY actual users (WHERE user_type != 'organization')
-- 2. This is DIFFERENT from admin console - admin shows all profiles, we only count users
-- 3. Automatically updates via database triggers whenever profiles table changes
-- 4. Always shows real-time count of actual users (students, external, admin, faculty, etc.)
-- 5. No manual intervention needed - count updates automatically

-- First, ensure the content table has the statistics entries
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Update the active volunteers function to count ONLY actual users (not organizations)
-- This is DIFFERENT from admin console - admin console shows all profiles, we only count users
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
    WHERE user_type != 'organization'  -- Only count actual users, not organizations
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create a function to manually update active volunteers count
CREATE OR REPLACE FUNCTION public.update_active_volunteers_manual()
RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.profiles
    WHERE user_type != 'organization'  -- Only count actual users, not organizations
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
END;
$$;

-- Drop existing triggers that might be interfering
DROP TRIGGER IF EXISTS trigger_update_active_volunteers ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_active_volunteers_profiles ON public.profiles;

-- Create new trigger on profiles table to update count when users are added/removed
-- This ensures the active volunteers count is ALWAYS real-time
CREATE TRIGGER trigger_update_active_volunteers_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_active_volunteers_count();

-- Update the current active volunteers count immediately
SELECT public.update_active_volunteers_manual();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_count() TO anon;
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_manual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_manual() TO anon;

-- Update statistics to match admin dashboard logic
-- This migration ensures hero page statistics match the admin dashboard calculations
--
-- CHANGES:
-- 1. Active Volunteers: Count all users where user_type != 'organization' (same as admin dashboard)
-- 2. Partner Organizations: Count all organizations from organizations table (same as admin dashboard)
-- 3. Hours Contributed: Keep the same calculation (no change requested)

-- Update the active volunteers function to match admin dashboard logic
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
    WHERE user_type != 'organization'  -- Same logic as admin dashboard
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the partner organizations function to match admin dashboard logic
CREATE OR REPLACE FUNCTION public.update_partner_organizations_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content 
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.organizations  -- Count all organizations from organizations table like admin dashboard
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create a function to manually update counts
CREATE OR REPLACE FUNCTION public.update_statistics_manual()
RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update active volunteers (same as admin dashboard)
  UPDATE public.content 
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.profiles
    WHERE user_type != 'organization'
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  -- Update partner organizations (same as admin dashboard)
  UPDATE public.content 
  SET value = (
    SELECT COUNT(*)::TEXT
    FROM public.organizations
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_active_volunteers_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_partner_organizations ON public.events;
DROP TRIGGER IF EXISTS trigger_update_partner_organizations_status ON public.organizations;

-- Create trigger on profiles table for active volunteers
CREATE TRIGGER trigger_update_active_volunteers_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_active_volunteers_count();

-- Create trigger on organizations table for partner organizations
CREATE TRIGGER trigger_update_partner_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_partner_organizations_count();

-- Update the current counts immediately
SELECT public.update_statistics_manual();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_active_volunteers_count() TO anon;
GRANT EXECUTE ON FUNCTION public.update_partner_organizations_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_organizations_count() TO anon;
GRANT EXECUTE ON FUNCTION public.update_statistics_manual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_statistics_manual() TO anon;
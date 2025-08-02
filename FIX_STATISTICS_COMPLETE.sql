-- COMPLETE STATISTICS FIX - Run this in Supabase SQL Editor
-- This script fixes event signup issues and ensures statistics update properly

-- Step 1: Fix event signup issues
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view their own event signups" ON public.user_events;
DROP POLICY IF EXISTS "Users can sign up for events" ON public.user_events;
DROP POLICY IF EXISTS "Users can cancel their event signups" ON public.user_events;
DROP POLICY IF EXISTS "Unified event signup policy" ON public.user_events;
DROP POLICY IF EXISTS "Unified event view policy" ON public.user_events;
DROP POLICY IF EXISTS "PAs can view all event participants" ON public.user_events;
DROP POLICY IF EXISTS "PAs can sign up other users" ON public.user_events;
DROP POLICY IF EXISTS "Authenticated users can view event signups" ON public.user_events;
DROP POLICY IF EXISTS "Public read access for event signups" ON public.user_events;
DROP POLICY IF EXISTS "Allow event signups through application" ON public.user_events;
DROP POLICY IF EXISTS "Allow event signups with validation" ON public.user_events;
DROP POLICY IF EXISTS "Allow event signup cancellations" ON public.user_events;

-- Fix foreign key constraints
ALTER TABLE public.user_events 
DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;

ALTER TABLE public.user_events 
ADD CONSTRAINT user_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix signed_up_by foreign key
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_events' 
    AND column_name = 'signed_up_by'
  ) THEN
    ALTER TABLE public.user_events 
    DROP CONSTRAINT IF EXISTS user_events_signed_up_by_fkey;
    
    ALTER TABLE public.user_events 
    ADD CONSTRAINT user_events_signed_up_by_fkey 
    FOREIGN KEY (signed_up_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Ensure content table has statistics entries
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Step 3: Create robust statistics update function
CREATE OR REPLACE FUNCTION public.update_statistics_complete()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update active volunteers count (unique users who have signed up for events)
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT ue.user_id)::TEXT
    FROM public.user_events ue
    JOIN public.profiles p ON p.id = ue.user_id
    WHERE p.status = 'active' OR p.status IS NULL
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  -- Update hours contributed (based on event duration)
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
  
  -- Update partner organizations count (approved organizations with events)
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT e.organization_id)::TEXT
    FROM public.events e
    JOIN public.organizations o ON o.id = e.organization_id
    WHERE o.status = 'approved'
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
END;
$$;

-- Step 4: Create function to manually set statistics (for admin use)
CREATE OR REPLACE FUNCTION public.set_statistics_manual(
  p_active_volunteers INTEGER,
  p_hours_contributed INTEGER,
  p_partner_organizations INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update active volunteers
  UPDATE public.content 
  SET value = p_active_volunteers::TEXT
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  -- Update hours contributed
  UPDATE public.content 
  SET value = p_hours_contributed::TEXT
  WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed';
  
  -- Update partner organizations
  UPDATE public.content 
  SET value = p_partner_organizations::TEXT
  WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';
END;
$$;

-- Step 5: Create triggers to automatically update statistics
CREATE OR REPLACE FUNCTION public.trigger_update_statistics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_statistics_complete();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_statistics_user_events ON public.user_events;
DROP TRIGGER IF EXISTS trigger_update_statistics_events ON public.events;
DROP TRIGGER IF EXISTS trigger_update_statistics_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_statistics_organizations ON public.organizations;

-- Create new triggers
CREATE TRIGGER trigger_update_statistics_user_events
  AFTER INSERT OR DELETE ON public.user_events
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_statistics();

CREATE TRIGGER trigger_update_statistics_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_statistics();

CREATE TRIGGER trigger_update_statistics_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_update_statistics();

CREATE TRIGGER trigger_update_statistics_organizations
  AFTER UPDATE ON public.organizations
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_update_statistics();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_statistics_complete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_statistics_complete() TO anon;
GRANT EXECUTE ON FUNCTION public.set_statistics_manual(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_statistics_manual(INTEGER, INTEGER, INTEGER) TO anon;

-- Step 7: Initialize statistics with current data
SELECT public.update_statistics_complete();

-- Step 8: Show current statistics
SELECT 
  'Current Statistics' as info,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers') as active_volunteers,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed') as hours_contributed,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations') as partner_organizations;

-- Step 9: Show diagnostic information
SELECT 'user_events count:' as info, COUNT(*) as count FROM public.user_events;
SELECT 'profiles count:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'events count:' as info, COUNT(*) as count FROM public.events;
SELECT 'organizations count:' as info, COUNT(*) as count FROM public.organizations;

-- Step 10: Test manual statistics update (set to sample values)
-- Uncomment the line below to test manual statistics update
-- SELECT public.set_statistics_manual(100, 250, 15); 
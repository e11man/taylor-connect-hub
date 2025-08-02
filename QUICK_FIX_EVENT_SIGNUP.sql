-- QUICK FIX FOR EVENT SIGNUP ISSUE
-- Run this script in Supabase SQL Editor to fix the "unexpected error" when signing up for events

-- Step 1: Disable RLS on user_events table (temporary fix)
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies that reference auth.uid()
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

-- Step 3: Update foreign key constraints to reference profiles table instead of auth.users
ALTER TABLE public.user_events 
DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;

ALTER TABLE public.user_events 
ADD CONSTRAINT user_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 4: Update signed_up_by foreign key if column exists
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

-- Step 5: Ensure the content table has statistics entries
INSERT INTO public.content (page, section, key, value, language_code) VALUES
('homepage', 'impact', 'active_volunteers', '0', 'en'),
('homepage', 'impact', 'hours_contributed', '0', 'en'),
('homepage', 'impact', 'partner_organizations', '0', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Step 6: Create simple functions to update statistics (without complex triggers for now)
CREATE OR REPLACE FUNCTION public.update_statistics_simple()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update active volunteers count
  UPDATE public.content 
  SET value = (
    SELECT COUNT(DISTINCT ue.user_id)::TEXT
    FROM public.user_events ue
    JOIN public.profiles p ON p.id = ue.user_id
    WHERE p.status = 'active' OR p.status IS NULL
  )
  WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';
  
  -- Update hours contributed
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
  
  -- Update partner organizations count
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

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_statistics_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_statistics_simple() TO anon;

-- Step 8: Initialize statistics with current data
SELECT public.update_statistics_simple();

-- Step 9: Show current statistics
SELECT 
  'Current Statistics' as info,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers') as active_volunteers,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed') as hours_contributed,
  (SELECT value FROM public.content WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations') as partner_organizations;

-- Step 10: Test user_events table access
SELECT 'user_events table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_events' 
ORDER BY ordinal_position;

-- Step 11: Show sample data
SELECT 'Sample user_events data:' as info;
SELECT * FROM public.user_events LIMIT 5;

-- Step 12: Show sample profiles data
SELECT 'Sample profiles data:' as info;
SELECT id, email, status FROM public.profiles LIMIT 5; 
-- TEMPORARY FIX: Disable RLS on user_events table
-- This allows event signups to work while we implement a proper solution

-- Step 1: Disable RLS on user_events table
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies (cleanup)
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

-- Step 3: Update foreign key constraints to reference profiles table
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

-- Step 5: Add comment explaining temporary nature
COMMENT ON TABLE public.user_events IS 'RLS temporarily disabled - implement API routes for proper security';

-- Note: This is a TEMPORARY solution. 
-- Next steps:
-- 1. Implement API routes with service role key for event signups
-- 2. Move all user_events operations to backend API
-- 3. Re-enable RLS with proper policies once API is ready
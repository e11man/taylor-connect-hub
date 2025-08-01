-- Fix user_events table to work with custom authentication
-- This migration updates the user_events table to reference profiles instead of auth.users
-- and updates RLS policies to work without auth.uid()

-- Step 1: Drop existing foreign key constraint
ALTER TABLE public.user_events 
DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;

-- Step 2: Add new foreign key constraint to profiles table
ALTER TABLE public.user_events 
ADD CONSTRAINT user_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Drop all existing RLS policies on user_events
DROP POLICY IF EXISTS "Users can view their own event signups" ON public.user_events;
DROP POLICY IF EXISTS "Users can sign up for events" ON public.user_events;
DROP POLICY IF EXISTS "Users can cancel their event signups" ON public.user_events;
DROP POLICY IF EXISTS "Unified event signup policy" ON public.user_events;
DROP POLICY IF EXISTS "Unified event view policy" ON public.user_events;
DROP POLICY IF EXISTS "PAs can view all event participants" ON public.user_events;
DROP POLICY IF EXISTS "PAs can sign up other users" ON public.user_events;

-- Step 4: Create new RLS policies that don't rely on auth.uid()
-- Since we can't use auth.uid() anymore, we implement permissive policies
-- The application layer will handle authentication and authorization

-- IMPORTANT: There are two approaches to solve this:
-- 1. Use these permissive policies (current approach)
-- 2. Create API routes with service role key (like content management)

-- Allow all requests to view event signups
-- The application will filter based on the user's session
CREATE POLICY "Public read access for event signups" 
ON public.user_events 
FOR SELECT 
USING (true); -- Application layer handles user-specific filtering

-- Allow inserts for event signups with basic validation
CREATE POLICY "Allow event signups with validation" 
ON public.user_events 
FOR INSERT 
WITH CHECK (
  -- Ensure the event exists and has capacity
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND (
      e.max_participants IS NULL 
      OR (
        SELECT COUNT(*) FROM public.user_events ue 
        WHERE ue.event_id = e.id
      ) < e.max_participants
    )
  )
  -- Ensure the user profile exists and is active
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id
    AND (p.status IS NULL OR p.status = 'active')
  )
  -- Prevent duplicate signups
  AND NOT EXISTS (
    SELECT 1 FROM public.user_events ue
    WHERE ue.user_id = user_id
    AND ue.event_id = event_id
  )
);

-- Allow deletion of event signups
CREATE POLICY "Allow event signup cancellations" 
ON public.user_events 
FOR DELETE 
USING (true); -- Application layer ensures users can only delete their own signups

-- Step 5: Update signed_up_by column foreign key if it exists
DO $$ 
BEGIN
  -- Check if signed_up_by column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_events' 
    AND column_name = 'signed_up_by'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE public.user_events 
    DROP CONSTRAINT IF EXISTS user_events_signed_up_by_fkey;
    
    -- Add new constraint to profiles
    ALTER TABLE public.user_events 
    ADD CONSTRAINT user_events_signed_up_by_fkey 
    FOREIGN KEY (signed_up_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Update user_roles table foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
    
    -- Add new constraint to profiles
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 7: Create helper function to get user role
-- This can be used in RLS policies if needed
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = p_user_id),
    (SELECT role FROM public.profiles WHERE id = p_user_id),
    'user'
  );
$$;

-- Step 8: Add comments for documentation
COMMENT ON POLICY "Public read access for event signups" ON public.user_events 
IS 'Allows public read access to event signups. Application layer handles user-specific filtering.';

COMMENT ON POLICY "Allow event signups with validation" ON public.user_events 
IS 'Allows event signups with basic validation. Application layer handles user authentication.';

COMMENT ON POLICY "Allow event signup cancellations" ON public.user_events 
IS 'Allows deletion of event signups. Application layer ensures users can only delete their own signups.';

COMMENT ON FUNCTION public.get_user_role(UUID) 
IS 'Helper function to get user role from either user_roles table or profiles table';

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_id ON public.user_events(event_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_event ON public.user_events(user_id, event_id);
-- Fix PA Group Signup RLS Policies
-- This migration replaces conflicting policies with unified ones

-- Drop the conflicting original policy
DROP POLICY IF EXISTS "Users can sign up for events" ON public.user_events;

-- Drop the PA policy that might be causing issues
DROP POLICY IF EXISTS "PAs can sign up other users" ON public.user_events;

-- Create a unified INSERT policy that allows both self-signups and PA group signups
CREATE POLICY "Unified event signup policy" 
ON public.user_events 
FOR INSERT 
WITH CHECK (
  -- Allow self-signups (original functionality)
  auth.uid() = user_id 
  OR 
  -- Allow PAs to sign up other users (new functionality)
  (
    auth.uid() = signed_up_by 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'pa'
    )
  )
);

-- Ensure the SELECT policy allows PAs to view all participants
DROP POLICY IF EXISTS "PAs can view all event participants" ON public.user_events;
CREATE POLICY "Unified event view policy" 
ON public.user_events 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'pa'
  )
);

-- Keep the DELETE policy for self-cancellations
-- (This should already exist and be working correctly)

-- Add comment for documentation
COMMENT ON POLICY "Unified event signup policy" ON public.user_events IS 'Allows both self-signups and PA group signups';
COMMENT ON POLICY "Unified event view policy" ON public.user_events IS 'Allows users to view their own signups and PAs to view all signups'; 
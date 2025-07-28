-- Add policy to allow authenticated users to view other active user profiles
-- This is needed for the group signup functionality to work
CREATE POLICY "Authenticated users can view active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (status = 'active');
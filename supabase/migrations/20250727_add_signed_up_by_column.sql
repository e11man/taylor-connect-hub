-- Add signed_up_by column to track which PA signed up users
ALTER TABLE public.user_events
ADD COLUMN signed_up_by UUID REFERENCES auth.users(id);

-- Update RLS policies to allow PAs to sign up other users
CREATE POLICY "PAs can sign up other users" 
ON public.user_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR (
    auth.uid() = signed_up_by 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'pa'
    )
  )
);

-- Allow PAs to view all event participants
CREATE POLICY "PAs can view all event participants" 
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

-- Add index for better query performance
CREATE INDEX idx_user_events_signed_up_by ON public.user_events(signed_up_by);

-- Add comment for documentation
COMMENT ON COLUMN public.user_events.signed_up_by IS 'User ID of the PA who signed up this user (NULL if self-signup)';
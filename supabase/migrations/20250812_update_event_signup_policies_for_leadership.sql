-- Update unified event signup policy to include all leadership roles and use profiles.role
DROP POLICY IF EXISTS "Unified event signup policy" ON public.user_events;

CREATE POLICY "Unified event signup policy"
ON public.user_events
FOR INSERT
WITH CHECK (
  -- Allow self-signups
  auth.uid() = user_id
  OR
  -- Allow leaders to sign up others
  (
    auth.uid() = signed_up_by
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('pa','faculty','student_leader','admin')
    )
  )
);

-- Update view policy similarly
DROP POLICY IF EXISTS "Unified event view policy" ON public.user_events;
CREATE POLICY "Unified event view policy"
ON public.user_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('pa','faculty','student_leader','admin')
  )
);

COMMENT ON POLICY "Unified event signup policy" ON public.user_events IS 'Allows self-signups and leader group signups (pa, faculty, student_leader, admin via profiles.role)';
COMMENT ON POLICY "Unified event view policy" ON public.user_events IS 'Allows users to view own signups and leaders to view all';
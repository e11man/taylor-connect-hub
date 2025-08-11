-- Fix user_events foreign key to reference profiles(id) for custom direct auth

-- Disable RLS temporarily to avoid policy interference
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;

-- Ensure user_id references profiles(id)
ALTER TABLE public.user_events
  DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;

ALTER TABLE public.user_events
  ADD CONSTRAINT user_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- If signed_up_by exists, ensure it also references profiles(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_events' AND column_name = 'signed_up_by'
  ) THEN
    ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_signed_up_by_fkey;
    ALTER TABLE public.user_events ADD CONSTRAINT user_events_signed_up_by_fkey
      FOREIGN KEY (signed_up_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure event_id references events(id)
ALTER TABLE public.user_events
  DROP CONSTRAINT IF EXISTS user_events_event_id_fkey;

ALTER TABLE public.user_events
  ADD CONSTRAINT user_events_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_id ON public.user_events(event_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_event ON public.user_events(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_user_events_signed_up_by ON public.user_events(signed_up_by);

-- Keep table accessible for direct auth
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_events TO authenticated;



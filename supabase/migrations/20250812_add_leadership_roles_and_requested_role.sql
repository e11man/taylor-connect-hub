-- Add new leadership roles to enum and requested_role to profiles
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'faculty';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student_leader';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add requested_role column to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS requested_role public.user_role;

-- Optional: function to check leadership roles (pa, faculty, student_leader, admin)
CREATE OR REPLACE FUNCTION public.is_leadership(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = $1 AND ur.role IN ('pa','faculty','student_leader','admin')
  );
$$;
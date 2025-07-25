-- Add PA role support to user_roles enum
-- First, we need to check if 'pa' is already in the enum, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pa' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'pa';
    END IF;
END $$;

-- Update is_pa function to handle the new enum value properly
CREATE OR REPLACE FUNCTION public.is_pa(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND (role = 'pa' OR role = 'admin')
  );
$function$;
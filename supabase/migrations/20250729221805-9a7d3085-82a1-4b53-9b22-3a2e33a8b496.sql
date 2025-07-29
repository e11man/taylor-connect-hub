-- Add email_confirmed column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN email_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Create function to confirm organization email
CREATE OR REPLACE FUNCTION public.confirm_organization_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.organizations 
  SET email_confirmed = true 
  WHERE organizations.user_id = $1;
END;
$function$
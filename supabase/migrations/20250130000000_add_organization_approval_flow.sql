-- Add email confirmation and admin approval fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing organizations to be approved (for backward compatibility)
UPDATE public.organizations 
SET status = 'approved', email_confirmed = TRUE, approved_at = NOW()
WHERE status = 'pending';

-- Update RLS policies to check organization status
DROP POLICY IF EXISTS "Organizations can view their own profile" ON public.organizations;
CREATE POLICY "Organizations can view their own profile" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() = user_id AND status = 'approved');

-- Allow organizations to view their own profile even when pending (for status checks)
CREATE POLICY "Organizations can view own profile for status" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all organizations
CREATE POLICY "Admins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update organization status
CREATE POLICY "Admins can update organization status" 
ON public.organizations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle organization approval
CREATE OR REPLACE FUNCTION public.approve_organization(
  org_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve organizations';
  END IF;

  -- Update organization status
  UPDATE public.organizations
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = admin_user_id,
    updated_at = NOW()
  WHERE id = org_id;

  RETURN TRUE;
END;
$$;

-- Create function to handle organization rejection
CREATE OR REPLACE FUNCTION public.reject_organization(
  org_id UUID,
  admin_user_id UUID,
  reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject organizations';
  END IF;

  -- Update organization status
  UPDATE public.organizations
  SET 
    status = 'rejected',
    rejection_reason = reason,
    updated_at = NOW()
  WHERE id = org_id;

  RETURN TRUE;
END;
$$;

-- Create trigger function for new organization registrations
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert organization record with pending status
  INSERT INTO public.organizations (
    user_id,
    name,
    description,
    website,
    phone,
    contact_email,
    status,
    email_confirmed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'description', ''),
    COALESCE(NEW.raw_user_meta_data->>'website', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    'pending',
    FALSE
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new organization users
DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'organization')
  EXECUTE FUNCTION public.handle_new_organization();

-- Create function to update organization email confirmation status
CREATE OR REPLACE FUNCTION public.confirm_organization_email(
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organizations
  SET 
    email_confirmed = TRUE,
    updated_at = NOW()
  WHERE user_id = confirm_organization_email.user_id;

  RETURN TRUE;
END;
$$;
-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'pa', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add status column to profiles for pending users
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked'));

-- Add approval fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'admin'
  );
$$;

-- Create function to check if user has PA role
CREATE OR REPLACE FUNCTION public.is_pa(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND (role = 'pa' OR role = 'admin')
  );
$$;

-- Update profiles RLS policies to include admin access
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Update organizations RLS policies to include admin access
CREATE POLICY "Admins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all organizations" 
ON public.organizations 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Update the user creation trigger to check email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  user_status TEXT DEFAULT 'active';
BEGIN
  -- Check if email ends with taylor.edu
  IF NOT NEW.email LIKE '%@taylor.edu' THEN
    user_status := 'pending';
  END IF;

  -- Handle regular users (students)
  IF NEW.raw_user_meta_data ->> 'user_type' IS NULL OR NEW.raw_user_meta_data ->> 'user_type' = 'student' THEN
    INSERT INTO public.profiles (user_id, email, dorm, wing, status)
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data ->> 'dorm',
      NEW.raw_user_meta_data ->> 'wing',
      user_status
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
  -- Handle organizations
  ELSIF NEW.raw_user_meta_data ->> 'user_type' = 'organization' THEN
    INSERT INTO public.organizations (
      user_id, 
      name, 
      description, 
      website, 
      phone, 
      contact_email,
      status
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'organization_name',
      NEW.raw_user_meta_data ->> 'description',
      NEW.raw_user_meta_data ->> 'website',
      NEW.raw_user_meta_data ->> 'phone',
      NEW.email,
      'pending'
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for user_roles timestamp updates
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update organizations policy to allow approved orgs to login
DROP POLICY IF EXISTS "Organizations can view their own profile" ON public.organizations;
CREATE POLICY "Organizations can view their own profile" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() = user_id AND status = 'approved');
-- Create organizations table for organization profiles
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Organizations can view their own profile" 
ON public.organizations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Organizations can create their own profile" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizations can update their own profile" 
ON public.organizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add organization_id to events table
ALTER TABLE public.events 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update events RLS policies to include organization management
CREATE POLICY "Organizations can manage their own events" 
ON public.events 
FOR ALL 
USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()));

-- Create trigger for organizations timestamp updates
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new organization user
CREATE OR REPLACE FUNCTION public.handle_new_organization_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Only create organization profile if metadata indicates it's an organization
  IF NEW.raw_user_meta_data ->> 'user_type' = 'organization' THEN
    INSERT INTO public.organizations (
      user_id, 
      name, 
      description, 
      website, 
      phone, 
      contact_email
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'organization_name',
      NEW.raw_user_meta_data ->> 'description',
      NEW.raw_user_meta_data ->> 'website',
      NEW.raw_user_meta_data ->> 'phone',
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Update the existing trigger to handle both user types
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Handle regular users (students)
  IF NEW.raw_user_meta_data ->> 'user_type' IS NULL OR NEW.raw_user_meta_data ->> 'user_type' = 'student' THEN
    INSERT INTO public.profiles (user_id, email, dorm, wing)
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data ->> 'dorm',
      NEW.raw_user_meta_data ->> 'wing'
    );
  -- Handle organizations
  ELSIF NEW.raw_user_meta_data ->> 'user_type' = 'organization' THEN
    INSERT INTO public.organizations (
      user_id, 
      name, 
      description, 
      website, 
      phone, 
      contact_email
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'organization_name',
      NEW.raw_user_meta_data ->> 'description',
      NEW.raw_user_meta_data ->> 'website',
      NEW.raw_user_meta_data ->> 'phone',
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
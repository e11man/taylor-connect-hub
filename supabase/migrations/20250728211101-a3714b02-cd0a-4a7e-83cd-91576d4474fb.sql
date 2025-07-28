-- Fix the remaining function that still has mutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_status TEXT DEFAULT 'active';
BEGIN
  -- Check if email ends with taylor.edu
  IF NOT NEW.email LIKE '%@taylor.edu' THEN
    user_status := 'pending';
  END IF;

  -- Handle regular users (students and external)
  IF NEW.raw_user_meta_data ->> 'user_type' IS NULL 
     OR NEW.raw_user_meta_data ->> 'user_type' = 'student'
     OR NEW.raw_user_meta_data ->> 'user_type' = 'external' THEN
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
-- Fix infinite recursion in user_roles RLS policies
-- The current policies query user_roles table within policies applied to user_roles,
-- causing infinite recursion. We need to use the SECURITY DEFINER is_admin function instead.

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Create new policies using the SECURITY DEFINER is_admin function
-- This bypasses RLS and prevents infinite recursion
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Also add a policy for users to view their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());
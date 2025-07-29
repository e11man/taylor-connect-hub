-- Critical Fix: Organization Login After Manual Approval
-- Fix RLS Policies for Organizations Table

-- First, check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'organizations';

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organizations can view their own profile" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can create their own profile" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can update their own profile" ON public.organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

-- Create new policies that work correctly
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

-- Allow admins to view all organizations
CREATE POLICY "Admins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to manage all organizations
CREATE POLICY "Admins can manage all organizations" 
ON public.organizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Verify the new policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY policyname;

-- Test organization lookup for debugging
-- Replace 'USER_ID_HERE' with actual user ID when testing
/*
SELECT 
  o.id,
  o.user_id,
  o.name,
  o.contact_email,
  o.status,
  au.email as auth_email
FROM public.organizations o
LEFT JOIN auth.users au ON o.user_id = au.id
WHERE o.user_id = 'USER_ID_HERE';
*/

-- Check all organizations and their status
SELECT 
  o.id,
  o.user_id,
  o.name,
  o.contact_email,
  o.status,
  o.created_at,
  au.email as auth_email
FROM public.organizations o
LEFT JOIN auth.users au ON o.user_id = au.id
ORDER BY o.created_at DESC;
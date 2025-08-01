-- Fix organizations.approved_by foreign key constraint to reference profiles table
-- Drop the existing foreign key constraint
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS organizations_approved_by_fkey;

-- Add new foreign key constraint referencing profiles table
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES profiles(id);

-- Add comment explaining the change
COMMENT ON COLUMN public.organizations.approved_by IS 'References profiles.id for the admin who approved this organization'; 
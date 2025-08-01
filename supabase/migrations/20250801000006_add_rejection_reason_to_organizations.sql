-- Add rejection_reason column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.organizations.rejection_reason IS 'Reason for rejection if organization status is rejected'; 
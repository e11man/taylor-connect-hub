-- Add missing columns to events table
-- This migration adds columns that the application expects but are missing from the current schema

-- Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_point TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add foreign key constraint for created_by column
ALTER TABLE public.events 
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add check constraint for status column
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'draft'));

-- Create index on created_by for better query performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Update existing events to have a created_by value if possible
-- This will set created_by to the organization's user_id for existing events
UPDATE public.events 
SET created_by = (
  SELECT o.user_id 
  FROM public.organizations o 
  WHERE o.id = events.organization_id
)
WHERE created_by IS NULL AND organization_id IS NOT NULL;

COMMIT;
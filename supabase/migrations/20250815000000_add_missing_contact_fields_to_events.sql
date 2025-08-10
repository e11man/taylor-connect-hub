-- Add missing contact fields to events table
-- This migration adds contact_person_phone and special_instructions columns that the application expects

-- Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Grant necessary permissions
GRANT ALL ON events TO anon, authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added missing contact_person_phone and special_instructions columns to events table';
  RAISE NOTICE 'Organizations can now create opportunities with contact phone and special instructions';
END $$;

COMMIT;
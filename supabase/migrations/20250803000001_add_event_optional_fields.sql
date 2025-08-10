-- Add optional fields to events table
ALTER TABLE events 
ADD COLUMN meeting_point TEXT,
ADD COLUMN contact_person TEXT,
ADD COLUMN contact_person_phone TEXT,
ADD COLUMN special_instructions TEXT;

-- Add comments for documentation
COMMENT ON COLUMN events.meeting_point IS 'Optional meeting point details (e.g., "Door 6", "Main Entrance")';
COMMENT ON COLUMN events.contact_person IS 'Optional contact person name for the event';
COMMENT ON COLUMN events.contact_person_phone IS 'Optional contact person phone number';
COMMENT ON COLUMN events.special_instructions IS 'Optional special instructions (e.g., "Bring water bottle", "Wear comfortable shoes")';

-- Update RLS policies if needed (assuming events table has RLS)
-- The new columns will inherit existing RLS policies automatically
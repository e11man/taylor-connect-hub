-- Update Events Table to Properly Handle Arrival and End Times
-- This migration ensures proper time field handling and adds validation

-- Add check constraint to ensure end time is after arrival time
ALTER TABLE public.events 
ADD CONSTRAINT check_event_times 
CHECK (
  (arrival_time IS NULL AND estimated_end_time IS NULL) OR
  (arrival_time IS NOT NULL AND estimated_end_time IS NOT NULL AND estimated_end_time > arrival_time)
);

-- Add comment for documentation
COMMENT ON COLUMN public.events.arrival_time IS 'When volunteers should arrive at the event';
COMMENT ON COLUMN public.events.estimated_end_time IS 'When the event is expected to end';

-- Create function to validate event times
CREATE OR REPLACE FUNCTION public.validate_event_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure both times are provided together or neither is provided
  IF (NEW.arrival_time IS NULL AND NEW.estimated_end_time IS NOT NULL) OR
     (NEW.arrival_time IS NOT NULL AND NEW.estimated_end_time IS NULL) THEN
    RAISE EXCEPTION 'Both arrival_time and estimated_end_time must be provided together';
  END IF;
  
  -- Ensure end time is after arrival time
  IF NEW.arrival_time IS NOT NULL AND NEW.estimated_end_time IS NOT NULL AND
     NEW.estimated_end_time <= NEW.arrival_time THEN
    RAISE EXCEPTION 'Estimated end time must be after arrival time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate event times
CREATE TRIGGER validate_event_times_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_event_times();

-- Update existing events to have proper time fields if they don't already
-- This sets arrival_time to the event date and end_time to 2 hours later for existing events
UPDATE public.events 
SET 
  arrival_time = date,
  estimated_end_time = date + INTERVAL '2 hours'
WHERE arrival_time IS NULL AND estimated_end_time IS NULL;

-- Create function to get event duration in hours
CREATE OR REPLACE FUNCTION public.get_event_duration_hours(event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    CEILING(
      EXTRACT(EPOCH FROM (estimated_end_time - arrival_time)) / 3600
    ), 0
  )::INTEGER
  FROM public.events
  WHERE id = event_id
    AND arrival_time IS NOT NULL 
    AND estimated_end_time IS NOT NULL;
$$;

-- Create function to format event time range
CREATE OR REPLACE FUNCTION public.format_event_time_range(arrival_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    TO_CHAR(arrival_time, 'HH:MI AM') || ' - ' || TO_CHAR(end_time, 'HH:MI AM')
  WHERE arrival_time IS NOT NULL AND end_time IS NOT NULL;
$$;
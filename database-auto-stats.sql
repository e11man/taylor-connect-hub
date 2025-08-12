-- Auto-increment stats functions and triggers
-- This script creates database functions and triggers to automatically update 
-- the stats in the content table when events happen

-- 1. Function to update content stats
CREATE OR REPLACE FUNCTION update_content_stat(stat_key TEXT, increment_value INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    -- Update the stat value, or insert if it doesn't exist
    INSERT INTO content (page, section, key, value, language_code)
    VALUES ('homepage', 'impact', stat_key, increment_value::TEXT, 'en')
    ON CONFLICT (page, section, key, language_code) 
    DO UPDATE SET 
        value = (COALESCE(NULLIF(content.value, ''), '0')::INTEGER + increment_value)::TEXT,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 2. Function to calculate hours between two timestamps
CREATE OR REPLACE FUNCTION calculate_event_hours(arrival_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
    -- Return hours rounded to nearest integer, minimum 1 hour
    RETURN GREATEST(1, ROUND(EXTRACT(EPOCH FROM (end_time - arrival_time)) / 3600)::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- 3. Function triggered when user signs up for event
CREATE OR REPLACE FUNCTION handle_user_event_signup()
RETURNS TRIGGER AS $$
DECLARE
    event_hours INTEGER;
    arrival_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    -- Get event details for hour calculation
    SELECT e.arrival_time, e.estimated_end_time 
    INTO arrival_time, end_time
    FROM events e 
    WHERE e.id = NEW.event_id;
    
    -- Only process if this is a new signup (INSERT)
    IF TG_OP = 'INSERT' THEN
        -- Increment active volunteers count
        PERFORM update_content_stat('active_volunteers', 1);
        
        -- Calculate and add hours if both times are available
        IF arrival_time IS NOT NULL AND end_time IS NOT NULL THEN
            event_hours := calculate_event_hours(arrival_time, end_time);
            PERFORM update_content_stat('hours_contributed', event_hours);
        ELSE
            -- Default to 2 hours if times not specified
            PERFORM update_content_stat('hours_contributed', 2);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Function triggered when organization is approved
CREATE OR REPLACE FUNCTION handle_organization_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment when status changes from pending/rejected to approved
    IF NEW.status = 'approved' AND (OLD.status != 'approved' OR OLD.status IS NULL) THEN
        PERFORM update_content_stat('partner_organizations', 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to handle user event cancellation (decrement stats)
CREATE OR REPLACE FUNCTION handle_user_event_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    event_hours INTEGER;
    arrival_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    -- Get event details for hour calculation
    SELECT e.arrival_time, e.estimated_end_time 
    INTO arrival_time, end_time
    FROM events e 
    WHERE e.id = OLD.event_id;
    
    -- Only process if this is a cancellation (DELETE)
    IF TG_OP = 'DELETE' THEN
        -- Decrement active volunteers count
        PERFORM update_content_stat('active_volunteers', -1);
        
        -- Calculate and subtract hours if both times are available
        IF arrival_time IS NOT NULL AND end_time IS NOT NULL THEN
            event_hours := calculate_event_hours(arrival_time, end_time);
            PERFORM update_content_stat('hours_contributed', -event_hours);
        ELSE
            -- Default to -2 hours if times not specified
            PERFORM update_content_stat('hours_contributed', -2);
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_user_event_signup ON user_events;
DROP TRIGGER IF EXISTS trigger_user_event_cancellation ON user_events;
DROP TRIGGER IF EXISTS trigger_organization_approval ON organizations;

-- Create new triggers
CREATE TRIGGER trigger_user_event_signup
    AFTER INSERT ON user_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_event_signup();

CREATE TRIGGER trigger_user_event_cancellation
    AFTER DELETE ON user_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_event_cancellation();

CREATE TRIGGER trigger_organization_approval
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION handle_organization_approval();

-- 7. Initialize current stats based on existing data
DO $$
DECLARE
    current_volunteers INTEGER;
    current_hours INTEGER;
    current_orgs INTEGER;
BEGIN
    -- Count current volunteers (unique users who have signed up for events)
    SELECT COUNT(DISTINCT user_id) INTO current_volunteers FROM user_events;
    
    -- Count current hours (sum of all event hours based on signups)
    SELECT COALESCE(SUM(
        CASE 
            WHEN e.arrival_time IS NOT NULL AND e.estimated_end_time IS NOT NULL 
            THEN calculate_event_hours(e.arrival_time, e.estimated_end_time)
            ELSE 2 
        END
    ), 0) INTO current_hours
    FROM user_events ue
    JOIN events e ON ue.event_id = e.id;
    
    -- Count current approved organizations
    SELECT COUNT(*) INTO current_orgs FROM organizations WHERE status = 'approved';
    
    -- Update content with current values
    PERFORM update_content_stat('active_volunteers', current_volunteers - COALESCE((
        SELECT value::INTEGER FROM content 
        WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers'
    ), 0));
    
    PERFORM update_content_stat('hours_contributed', current_hours - COALESCE((
        SELECT value::INTEGER FROM content 
        WHERE page = 'homepage' AND section = 'impact' AND key = 'hours_contributed'
    ), 0));
    
    PERFORM update_content_stat('partner_organizations', current_orgs - COALESCE((
        SELECT value::INTEGER FROM content 
        WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations'
    ), 0));
    
    RAISE NOTICE 'Stats initialized: % volunteers, % hours, % organizations', current_volunteers, current_hours, current_orgs;
END;
$$;

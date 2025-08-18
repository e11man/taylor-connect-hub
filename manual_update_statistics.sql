-- Manual SQL Script to Update Statistics to Match Admin Dashboard Logic
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/editor)
--
-- This script updates the hero page statistics to match the admin dashboard calculations:
-- 1. Active Volunteers: Count all users where user_type != 'organization' (same as admin dashboard)
-- 2. Partner Organizations: Count all organizations from organizations table (same as admin dashboard)
-- 3. Hours Contributed: Keep the same calculation (no change requested)

-- First, let's check current statistics
SELECT key, value 
FROM content 
WHERE page = 'homepage' AND section = 'impact' 
AND key IN ('active_volunteers', 'partner_organizations', 'hours_contributed')
ORDER BY key;

-- Check what the counts should be
SELECT 'Active Volunteers (users excluding organizations)' as metric, COUNT(*) as count
FROM profiles
WHERE user_type != 'organization'
UNION ALL
SELECT 'Partner Organizations (all organizations)' as metric, COUNT(*) as count
FROM organizations;

-- Update the active volunteers count to match admin dashboard logic
UPDATE public.content 
SET value = (
  SELECT COUNT(*)::TEXT
  FROM public.profiles
  WHERE user_type != 'organization'  -- Same logic as admin dashboard
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'active_volunteers';

-- Update the partner organizations count to match admin dashboard logic
UPDATE public.content 
SET value = (
  SELECT COUNT(*)::TEXT
  FROM public.organizations  -- Count all organizations from organizations table like admin dashboard
)
WHERE page = 'homepage' AND section = 'impact' AND key = 'partner_organizations';

-- Verify the updates
SELECT key, value 
FROM content 
WHERE page = 'homepage' AND section = 'impact' 
AND key IN ('active_volunteers', 'partner_organizations', 'hours_contributed')
ORDER BY key;

-- Note: The database triggers from the migration file will keep these counts updated automatically
-- whenever profiles or organizations tables change
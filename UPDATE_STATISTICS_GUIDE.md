# Statistics Update Guide

This guide explains how the statistics on the hero page have been updated to match the admin dashboard logic.

## Changes Made

### 1. Active Volunteers
- **Before**: Counted users who have signed up for events
- **After**: Counts ALL users where `user_type != 'organization'` (matching admin dashboard)
- **SQL**: `SELECT COUNT(*) FROM profiles WHERE user_type != 'organization'`

### 2. Partner Organizations  
- **Before**: Counted unique organization IDs from events table
- **After**: Counts ALL organizations from organizations table (matching admin dashboard)
- **SQL**: `SELECT COUNT(*) FROM organizations`

### 3. Hours Contributed
- **No change**: Continues to calculate based on event durations from user_events

## Files Updated

1. **Database Migration**: `/workspace/supabase/migrations/20250814000000_update_statistics_to_match_admin_dashboard.sql`
   - Updates database functions to match admin dashboard logic
   - Creates triggers to automatically update counts

2. **Server API**: `/workspace/server.js`
   - Updated both GET and POST `/api/site-statistics` endpoints
   - Now calculates partner organizations from organizations table

3. **Manual SQL Script**: `/workspace/manual_update_statistics.sql`
   - Can be run directly in Supabase SQL editor to update counts immediately

## How to Apply Changes

### Option 1: Run the Migration (Recommended)
```bash
# If local Supabase is running:
npx supabase migration up

# Or push to remote:
npx supabase db push
```

### Option 2: Manual SQL Update
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/editor
2. Copy and run the contents of `/workspace/manual_update_statistics.sql`

### Option 3: Deploy Updated Server
Deploy the updated `server.js` file to ensure the API endpoints calculate statistics correctly.

## Verification

After updating, the hero page should show:
- **Active Volunteers**: Same count as "Individual Users" in admin dashboard
- **Partner Organizations**: Same count as "Partner Organizations" in admin dashboard
- **Hours Contributed**: Calculated from actual event signups

The counts will update automatically whenever:
- A new user is added/removed (profiles table)
- A new organization is added/removed (organizations table)
- User events are added/modified (for hours calculation)
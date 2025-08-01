# Statistics Feature - Admin Console

## Overview

The Statistics feature adds a new tab to the admin console that displays both confirmed totals and live estimates for key metrics:
- Active Volunteers
- Hours Contributed
- Partner Organizations

## Implementation

### Backend Components

1. **API Endpoint** (`api/statistics.py`)
   - `GET /api/statistics` - Fetches both recorded and live statistics
   - `POST /api/statistics` - Updates recorded statistics (admin only)
   - Uses Supabase Python client for database operations

2. **Database Table** (`site_stats`)
   - Stores confirmed statistics with `stat_name` and `value`
   - Created via migration: `supabase/migrations/20250201000000_create_site_stats_table.sql`
   - Row-level security ensures only admins can update values

### Frontend Components

1. **Statistics Component** (`src/components/admin/Statistics.tsx`)
   - Displays statistics cards with both "Confirmed Total" and "Current Estimate"
   - Includes refresh button to recalculate live values
   - Responsive design with mobile support
   - Number formatting with commas for readability

2. **Admin Dashboard Integration**
   - New "Statistics" tab added to admin console
   - Icon: BarChart3 from lucide-react
   - Positioned between Events and Content tabs

## Features

### Confirmed Total
- Official numbers stored in the database
- Manually set by administrators
- Persists across sessions
- Default values: 2,500 volunteers, 5,000 hours, 50 organizations

### Current Estimate
- Calculated in real-time from actual data:
  - **Active Volunteers**: Unique users who have signed up for events
  - **Hours Contributed**: Total event signups × 2 hours (default estimate)
  - **Partner Organizations**: Count from organizations table
- Updates on page load or manual refresh
- Shows difference indicator when higher than confirmed total

### Fallback Handling
- Graceful error handling with fallback values
- Toast notifications for errors
- Loading states during data fetching

## Database Migration

Run the migration to create the `site_stats` table:

```sql
-- Create site_stats table
CREATE TABLE IF NOT EXISTS public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_name TEXT NOT NULL UNIQUE,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default values
INSERT INTO public.site_stats (stat_name, value) VALUES
  ('active_volunteers', 2500),
  ('hours_contributed', 5000),
  ('partner_organizations', 50)
ON CONFLICT (stat_name) DO NOTHING;
```

## Deployment Notes

1. **Vercel Configuration**
   - The `/api/statistics` endpoint is automatically handled by Vercel
   - No additional configuration needed in `vercel.json`

2. **Environment Variables**
   - Uses existing Supabase environment variables
   - No new variables required

3. **Python Dependencies**
   - Updated `requirements.txt` with required packages
   - Uses `supabase==2.10.0` for database operations

## Usage

1. Navigate to Admin Dashboard
2. Click on the "Statistics" tab
3. View current statistics with both confirmed and live values
4. Click "Refresh Live Data" to recalculate current estimates
5. Admins can update confirmed values via API (future enhancement)

## Future Enhancements

1. **Admin Controls**
   - UI for updating confirmed values directly
   - History tracking for statistic changes
   - Export functionality

2. **Additional Metrics**
   - Average hours per volunteer
   - Growth trends over time
   - Event participation rates

3. **Visualization**
   - Charts showing trends
   - Comparison graphs
   - Real-time updates via WebSocket
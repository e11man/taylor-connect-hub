# Organization Email Notifications TODO

This document outlines the email notification services that need to be implemented to fully support organization notification preferences.

## Current State
- Email notification preferences UI is now implemented in the organization dashboard
- Database schema has been extended to include organization-specific preferences:
  - `volunteer_signups` - Notifications when volunteers sign up
  - `volunteer_cancellations` - Notifications when volunteers cancel
  - `weekly_summary` - Weekly activity reports
  - `system_updates` - Platform announcements

## Required Email Services

### 1. Volunteer Signup Notifications
- **Trigger**: When a user signs up for an organization's event
- **Recipients**: Organization representatives
- **Check**: `volunteer_signups` preference must be true
- **Email Content**: Volunteer name, event details, contact info

### 2. Volunteer Cancellation Notifications
- **Trigger**: When a user cancels their event signup
- **Recipients**: Organization representatives  
- **Check**: `volunteer_cancellations` preference must be true
- **Email Content**: Volunteer name, event details, cancellation time

### 3. Weekly Summary Reports
- **Trigger**: Scheduled cron job (weekly)
- **Recipients**: Organizations with `weekly_summary` = true
- **Email Content**: 
  - Number of events hosted
  - Total volunteer signups
  - Upcoming events
  - Recent activity

### 4. System Updates
- **Trigger**: Admin-initiated announcements
- **Recipients**: Organizations with `system_updates` = true
- **Email Content**: Platform updates, new features, maintenance notices

## Implementation Notes

All email services should:
1. Check the organization's `email_frequency` setting (immediate/daily/weekly/never)
2. Respect the specific notification type preferences
3. Use the same Resend API configuration as chat notifications
4. Log all sent notifications in the `notifications` table
5. Use consistent email templates with Main Street Connect branding

## Database Query Example

```sql
-- Get organization preferences before sending notifications
SELECT 
  np.email_frequency,
  np.volunteer_signups,
  np.volunteer_cancellations,
  np.weekly_summary,
  np.system_updates
FROM notification_preferences np
JOIN profiles p ON p.id = np.user_id
WHERE p.user_type = 'organization' 
  AND p.id = $organization_id;
```
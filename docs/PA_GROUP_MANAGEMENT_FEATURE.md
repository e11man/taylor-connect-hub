# PA Group Management Feature

## Overview
This feature allows PA-level users to manage group signups for events, including:
- Bulk signing up multiple users for events
- Viewing all event participants
- Automatic email confirmations for signed-up users
- Audit trail tracking which PA signed up which users

## Implementation Details

### Database Changes
1. **New Column**: `signed_up_by` in `user_events` table
   - Tracks which PA signed up a user
   - NULL for self-signups
   
2. **Updated RLS Policies**:
   - PAs can sign up other users
   - PAs can view all event participants
   - Regular users can only view their own signups

### Frontend Changes
1. **Group Signup Modal** (`GroupSignupModal.tsx`)
   - Shows list of users PA can sign up
   - Filters by floor/wing
   - Shows user commitment counts
   - Prevents signing up users at max commitments
   - Sends confirmation emails after signup

2. **View Participants Modal** (`ViewParticipantsModal.tsx`)
   - Shows all event participants
   - Groups by dorm/wing
   - Shows who signed up each user
   - Shows signup timestamp

3. **Opportunities Section** (`OpportunitiesSection.tsx`)
   - Shows "Add Group" button for PAs
   - Shows "View" link next to participant count for PAs
   - Integrates both modals

### Email Functionality
1. **Edge Function**: `send-signup-confirmation`
   - Sends personalized confirmation emails
   - Includes event details (title, date, time, location)
   - Notes if signed up by PA
   - Uses Resend for email delivery

## Deployment Steps

### 1. Database Migration
Apply the migration to add the `signed_up_by` column and update RLS policies:

```sql
-- File: supabase/migrations/20250727_add_signed_up_by_column.sql
-- This migration adds tracking for group signups and PA permissions
```

To apply:
- Go to Supabase Dashboard > SQL Editor
- Paste and run the migration file contents
- Or use: `supabase db push` if you have CLI configured

### 2. Deploy Edge Function
Deploy the email sending edge function:

```bash
# Set your project credentials
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_ACCESS_TOKEN=your-access-token

# Deploy the function
supabase functions deploy send-signup-confirmation
```

### 3. Environment Variables
Ensure these are set in your Supabase project:
- `RESEND_API_KEY` - Your Resend API key for sending emails

### 4. Frontend Deployment
The frontend changes will be deployed automatically with your next deployment.

## Usage

### For PA Users
1. **Group Signup**:
   - Navigate to any event you're not signed up for
   - Click the blue "Group" button
   - Select users to sign up
   - Optionally include yourself
   - Click "Sign Up X People"

2. **View Participants**:
   - For events with participants
   - Click "View" link next to participant count
   - See all signed-up users grouped by floor
   - See who signed up each user

### For Regular Users
- Will receive email confirmation when signed up by a PA
- Email includes event details and who signed them up
- Can view their signups in their dashboard as normal

## Email Templates
Confirmation emails include:
- Event title and description
- Date, time, and location
- Organization name (if applicable)
- Note about who signed them up (for group signups)
- Link to manage signups

## Security Considerations
- Only users with `role = 'pa'` can use group management features
- PAs can only sign up active users
- Respects max participant limits
- Respects individual user commitment limits (2 max)
- All actions are logged with `signed_up_by` for auditing

## Troubleshooting

### Edge Function Not Sending Emails
1. Check RESEND_API_KEY is set correctly
2. Check edge function logs in Supabase dashboard
3. Verify email addresses are valid

### PA Features Not Showing
1. Verify user has `role = 'pa'` in `user_roles` table
2. Check browser console for errors
3. Ensure user is logged in

### Migration Issues
1. Check for conflicting policies
2. Ensure all referenced tables exist
3. Check migration order if dependencies exist
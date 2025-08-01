# User Events RLS Fix Summary

## Problem
Users couldn't sign up for events due to RLS policy violation. The app moved from Supabase Auth to custom authentication, but `user_events` table still referenced `auth.users` and policies used `auth.uid()`.

## Solution
Created migration `20250202000000_fix_user_events_rls_for_custom_auth.sql` that:

1. **Updates Foreign Keys**
   - `user_events.user_id` now references `profiles(id)` instead of `auth.users(id)`
   - `signed_up_by` column also updated to reference `profiles(id)`

2. **Replaces RLS Policies**
   - Removed all policies using `auth.uid()`
   - Created permissive policies with application-layer security:
     - **Read**: Public access (app filters by user)
     - **Insert**: Validates event capacity, user exists, no duplicates
     - **Delete**: Open access (app ensures ownership)

3. **Maintains Data Integrity**
   - Event capacity limits enforced
   - Duplicate signups prevented
   - Only active users can sign up

## Deployment
```bash
# Run the migration
npx supabase migration up

# Or apply directly to production
psql $DATABASE_URL < supabase/migrations/20250202000000_fix_user_events_rls_for_custom_auth.sql
```

## Alternative Approach
If stricter security is needed, implement API routes with service role key (see `CONTENT_MANAGEMENT_FIX_SUMMARY.md` for example).

## Files Created
- `/workspace/supabase/migrations/20250202000000_fix_user_events_rls_for_custom_auth.sql` - The migration
- `/workspace/md/USER_EVENTS_RLS_FIX_README.md` - Detailed documentation
- `/workspace/USER_EVENTS_RLS_FIX_SUMMARY.md` - This summary
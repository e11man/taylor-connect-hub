# Foreign Key Constraint Fix for Event Signups

## Problem
When users try to sign up for events, they get this error:
```
insert or update on table "user_events" violates foreign key constraint "user_events_user_id_fkey"
Key (user_id)=(b8d80784-b37b-4794-9622-cc765ddbf17e) is not present in table "users".
```

## Root Cause
The `user_events` table has a foreign key constraint that references a `users` table that doesn't exist. The user data is actually stored in the `profiles` table.

## Solution
The foreign key constraint needs to be updated to reference `profiles(id)` instead of `users(id)`.

## Fix Instructions

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Fix user_events foreign key constraint
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_signed_up_by_fkey;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_signed_up_by_fkey 
  FOREIGN KEY (signed_up_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

### Option 2: Use Supabase CLI (if migrations are working)

1. Create a new migration file with the SQL above
2. Run `supabase db push`

### Option 3: Temporary Workaround (if you can't access dashboard)

The server has been updated to provide better error messages, but the underlying constraint issue needs to be fixed in the database.

## Verification

After applying the fix, test by:

1. Going to the Community Connect website
2. Trying to sign up for an event
3. The signup should work without the foreign key error

## Current Status

- ✅ Server updated with better error handling
- ✅ User validation added to prevent invalid user IDs
- ❌ Database foreign key constraint still needs to be fixed
- ❌ Event signups will fail until the constraint is updated

## Files Modified

- `server.js` - Added user validation and better error handling
- `FOREIGN_KEY_FIX_INSTRUCTIONS.md` - This documentation

## Next Steps

1. Apply the SQL fix in Supabase dashboard
2. Test event signups
3. Remove temporary error handling code if desired 
# 🔧 Complete Fix for User Events RLS Issue

## Problem
Users couldn't sign up for events due to RLS policy violations after migrating from Supabase Auth to custom authentication.

## Solutions Implemented

### 1. **Quick Fix - Disable RLS (Immediate Relief)**
**File**: `/workspace/supabase/migrations/20250202000001_disable_user_events_rls_temporarily.sql`

This migration:
- Disables RLS on `user_events` table completely
- Updates foreign keys to reference `profiles(id)` instead of `auth.users(id)`
- Provides immediate relief while proper solution is implemented

**Deploy this first:**
```bash
psql $DATABASE_URL < supabase/migrations/20250202000001_disable_user_events_rls_temporarily.sql
```

### 2. **API Route Solution (Recommended Long-term)**
**Files**: 
- `/workspace/server.js` - Added event signup API routes
- `/workspace/src/utils/eventSignupApi.ts` - API client utilities
- `/workspace/src/components/sections/OpportunitiesSection.tsx` - Updated to use API

**API Routes Added:**
- `POST /api/event-signup` - Sign up for an event
- `GET /api/user-events/:userId` - Get user's events
- `DELETE /api/event-signup` - Cancel signup

**Benefits:**
- Uses service role key to bypass RLS
- Centralized business logic
- Better error handling
- Capacity checking

### 3. **Alternative RLS Migration (If RLS is required)**
**File**: `/workspace/supabase/migrations/20250202000000_fix_user_events_rls_for_custom_auth.sql`

This migration attempts to fix RLS with permissive policies, but may not work without proper user context.

## Deployment Steps

### Option A: Quick Fix (Recommended for immediate relief)
```bash
# 1. Run the disable RLS migration
psql $DATABASE_URL < supabase/migrations/20250202000001_disable_user_events_rls_temporarily.sql

# 2. Test event signups - should work immediately
```

### Option B: API Route Solution (Recommended long-term)
```bash
# 1. Ensure server.js is running
npm run server

# 2. Frontend will automatically use API routes when available
# 3. Falls back to direct Supabase calls if API is down
```

### Option C: Both (Best approach)
```bash
# 1. Apply quick fix migration first
psql $DATABASE_URL < supabase/migrations/20250202000001_disable_user_events_rls_temporarily.sql

# 2. Deploy API routes
npm run server

# 3. Update all frontend components to use API routes
# 4. Re-enable RLS with proper policies once API is fully tested
```

## Testing

After deployment, test:
1. Regular user event signup
2. PA group signups
3. Event capacity limits
4. Duplicate signup prevention
5. Signup cancellation

## Files Modified

1. **Migrations:**
   - `20250202000001_disable_user_events_rls_temporarily.sql` ✅
   - `20250202000000_fix_user_events_rls_for_custom_auth.sql`

2. **Backend:**
   - `server.js` - Added event API routes ✅

3. **Frontend:**
   - `src/utils/eventSignupApi.ts` - API client utilities ✅
   - `src/components/sections/OpportunitiesSection.tsx` - Updated to use API ✅

4. **Documentation:**
   - `USER_EVENTS_RLS_FIX_SUMMARY.md`
   - `md/USER_EVENTS_RLS_FIX_README.md`
   - `USER_EVENTS_RLS_COMPLETE_FIX.md` (this file)

## Next Steps

1. Update remaining components to use API routes:
   - `GroupSignupModal.tsx`
   - `UserDashboard.tsx`
   - `groupSignupHelpers.ts`

2. Add authentication middleware to API routes

3. Consider implementing proper JWT tokens for RLS

## Key Takeaway

When migrating away from Supabase Auth, RLS policies that depend on `auth.uid()` will fail. Solutions:
- Disable RLS and handle security at application layer
- Use API routes with service role key
- Implement custom JWT tokens that Supabase can verify
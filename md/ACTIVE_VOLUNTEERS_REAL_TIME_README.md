# Active Volunteers Real-Time System

## Overview
The "Active Volunteers" statistic now automatically shows the real-time count of ACTUAL USERS (excluding organizations) in the system. This is DIFFERENT from the admin console, which shows all profiles including organizations.

## How It Works

### 1. **Real-Time Count Source**
```typescript
// Counts ONLY actual users, excluding organizations
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('*')
  .neq('user_type', 'organization')  // Exclude organizations
  .order('created_at', { ascending: false });

const totalUsers = profiles.length;
```

### 2. **Automatic Updates**
- **Database Trigger**: Automatically updates the count whenever the `profiles` table changes
- **Real-Time Subscription**: Frontend receives immediate updates when users are added/removed
- **No Manual Intervention**: Count is always current without running scripts

### 3. **What Gets Counted**
- ✅ **Students** (user_type = 'student')
- ✅ **External users** (user_type = 'external') 
- ✅ **Admin users** (user_type = 'admin')
- ✅ **PAs** (Program Assistants)
- ✅ **Faculty**
- ✅ **Student Leaders**
- ✅ **Regular users**
- ✅ **Pending users**
- ✅ **Active users**

### 4. **What Does NOT Get Counted**
- ❌ **Organizations** (user_type = 'organization')
- ❌ Users who only exist in `user_events` but not in `profiles`
- ❌ Deleted users
- ❌ Users from other tables

## Current Statistics

As of the latest update:
- **👥 Active Volunteers**: **8** (real-time count of actual users, excluding organizations)
- **⏰ Hours Contributed**: **100** (calculated from event signups)
- **🏢 Partner Organizations**: **10** (organizations with events)

## Files Modified

### Database Migration
- `supabase/migrations/20250813000000_fix_active_volunteers_count_all_users.sql`
  - Creates trigger function to automatically update count
  - Sets up database trigger on profiles table
  - Ensures count is always real-time

### Backend APIs
- `server.js` - Updated to use same query as admin console
- `api/statistics.py` - Updated to use same query as admin console

### Maintenance Scripts
- `scripts/refresh-all-statistics.js` - Updated to use same query as admin console
- `scripts/setup-real-time-volunteer-count.js` - Real-time monitoring script

## Real-Time Updates

### Database Level
```sql
-- Trigger automatically runs this function whenever profiles table changes
CREATE TRIGGER trigger_update_active_volunteers_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_active_volunteers_count();
```

### Frontend Level
```typescript
// useContent hook automatically subscribes to content changes
// Statistics update immediately when database changes
const { content: impactContent } = useContentSection('homepage', 'impact');
```

## Testing the System

### 1. **Add a New User**
- Register a new user account
- Active volunteers count should immediately increase by 1

### 2. **Remove a User**
- Delete a user from the admin console
- Active volunteers count should immediately decrease by 1

### 3. **Update User Status**
- Change a user's role or status
- Count should remain the same (still counts all users)

## Benefits

1. **Always Accurate**: Count is never stale or outdated
2. **Real-Time**: Updates happen immediately without page refresh
3. **Consistent**: Uses same logic as admin console
4. **Automatic**: No manual scripts or maintenance needed
5. **Transparent**: Shows actual user count, not estimated numbers

## Troubleshooting

### Count Not Updating
1. Check if database trigger is properly installed
2. Verify real-time subscriptions are working
3. Check browser console for errors

### Count Shows Wrong Number
1. Run `node scripts/refresh-all-statistics.js` to force update
2. Check if profiles table has the expected users
3. Verify RLS policies allow reading profiles

### Real-Time Not Working
1. Check Supabase real-time settings
2. Verify database triggers are active
3. Check network connectivity to Supabase

## Future Enhancements

- **Time-based filtering**: Show count for specific time periods
- **Role-based breakdowns**: Show counts by user role
- **Status-based filtering**: Show counts by user status
- **Geographic filtering**: Show counts by location/dorm

## Conclusion

The active volunteers system now provides a **real-time, accurate count** of all users in the system, automatically updating whenever the user base changes. This gives visitors and administrators an immediate understanding of the platform's current user base without any manual intervention.

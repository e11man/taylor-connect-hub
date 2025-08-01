# 🔧 User Events RLS Fix for Custom Authentication

## 🚨 Problem Identified

Users are unable to sign up for events, receiving the error:
```
new row violates row-level security policy for table "user_events"
```

## 🔍 Root Cause

The application has migrated away from Supabase Auth to a custom authentication system using the `profiles` table, but:

1. **Foreign Key Issue**: The `user_events` table still references `auth.users(id)` instead of `profiles(id)`
2. **RLS Policy Issue**: RLS policies still use `auth.uid()` which returns NULL since we're not using Supabase Auth
3. **No User Context**: Without Supabase Auth, there's no way to pass authenticated user context to RLS policies

## ✅ Solution Implemented

### **Migration: `20250202000000_fix_user_events_rls_for_custom_auth.sql`**

This migration fixes the issue by:

1. **Updating Foreign Keys**: Changes `user_events.user_id` to reference `profiles(id)` instead of `auth.users(id)`
2. **Removing auth.uid() Dependencies**: Drops all RLS policies that rely on `auth.uid()`
3. **Implementing Permissive Policies**: Creates new policies that allow operations with application-layer security

### **New RLS Policies**

1. **Public Read Access**: Allows all users to read event signups
   - Application layer filters results based on user session

2. **Validated Inserts**: Allows event signups with validations:
   - Event must exist and have capacity
   - User profile must exist and be active
   - Prevents duplicate signups

3. **Open Deletions**: Allows deletion of signups
   - Application layer ensures users can only delete their own

## 🎯 How It Works

### **Event Signup Flow**
```
User clicks "Sign Up" → Frontend validates session → Insert with user_id from session → RLS validates constraints → Success ✅
```

### **Security Model**
- **Database Layer**: Basic constraints (capacity, valid references, no duplicates)
- **Application Layer**: User authentication, authorization, and ownership checks

## 🚀 Deployment Instructions

1. **Run the migration**:
   ```bash
   npx supabase migration up
   ```

2. **Verify the changes**:
   ```sql
   -- Check foreign key
   SELECT conname, confrelid::regclass 
   FROM pg_constraint 
   WHERE conrelid = 'user_events'::regclass 
   AND contype = 'f';
   
   -- Check RLS policies
   SELECT polname, polcmd 
   FROM pg_policy 
   WHERE polrelid = 'user_events'::regclass;
   ```

3. **Test event signups**:
   - Try signing up for an event as a regular user
   - Try PA group signups if applicable
   - Verify duplicate prevention works

## ⚠️ Important Considerations

### **Alternative Approach: API Routes**

If more complex authorization is needed, consider using API routes with service role key (like content management):

```javascript
// server.js
app.post('/api/event-signup', authenticate, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id; // From session
  
  // Use service role key to bypass RLS
  const { data, error } = await supabaseAdmin
    .from('user_events')
    .insert({ user_id: userId, event_id: eventId });
    
  res.json({ data, error });
});
```

### **Future Improvements**

1. **Custom JWT Claims**: Implement custom JWT tokens that Supabase can verify
2. **Postgres Functions**: Create SECURITY DEFINER functions for complex operations
3. **Row Security Context**: Use Postgres session variables to pass user context

## 🔐 Security Notes

- This approach relies on application-layer security
- Ensure all API endpoints validate user sessions
- Consider rate limiting to prevent abuse
- Monitor for unauthorized access patterns

## 📚 Related Documentation

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Custom Authentication Patterns](https://supabase.com/docs/guides/auth/custom-auth)
- Content Management Fix: `CONTENT_MANAGEMENT_FIX_SUMMARY.md`
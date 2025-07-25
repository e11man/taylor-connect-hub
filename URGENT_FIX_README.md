# 🚨 URGENT FIX: Admin User Role Promotion Issue

## Problem
When admin users try to promote someone to PA (Program Administrator) or change user roles, the system throws this error:
```
"infinite recursion detected in policy for relation 'user_roles'"
```

## Root Cause
The Row Level Security (RLS) policies on the `user_roles` table are causing infinite recursion. The policies were checking if a user is an admin by querying the same `user_roles` table that the policy is protecting:

```sql
-- PROBLEMATIC POLICY (causes infinite recursion)
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
```

When an admin tries to update a user role:
1. The policy checks if they're admin by querying `user_roles`
2. That query triggers the same policy again
3. Which checks if they're admin by querying `user_roles`
4. Infinite loop → Error

## 🔧 IMMEDIATE FIX

### Option 1: Run SQL Script in Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250726000000_fix_user_roles_rls.sql` file
4. Click **Run** to execute the script

### Option 2: Apply Migration (If you have Supabase CLI access)

1. Ensure you're authenticated with Supabase CLI
2. Run: `npx supabase db push`

## ✅ What the Fix Does

The fix replaces the problematic policies with ones that use the existing `is_admin()` SECURITY DEFINER function:

```sql
-- NEW POLICY (no recursion)
CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));
```

The `is_admin()` function is defined as `SECURITY DEFINER`, which means it runs with elevated privileges and bypasses RLS, preventing the infinite recursion.

## 🧪 Testing the Fix

After applying the fix, test these scenarios:

1. **Admin promotes user to PA**: Should work without errors
2. **Admin demotes PA to user**: Should work without errors  
3. **Admin promotes user to admin**: Should work without errors
4. **Regular user tries to change roles**: Should be denied (as expected)

## 🔍 Verification

After running the fix, you can verify the new policies are in place:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_roles' 
ORDER BY policyname;
```

You should see these policies:
- `Admins can delete user roles`
- `Admins can insert user roles` 
- `Admins can update user roles`
- `Admins can view all user roles`
- `Users can view their own role`

## 📋 Files Modified/Created

- ✅ `supabase/migrations/20250726000000_fix_user_roles_rls.sql` - Migration file with the fix
- ✅ This README with complete instructions

## 🚀 Status
- ❌ **BROKEN**: Admin cannot promote users to PA (infinite recursion error)
- ✅ **WILL BE FIXED**: After running the SQL script in Supabase dashboard
- ✅ **BUILD STATUS**: Project builds successfully with no compilation errors

The application will work perfectly with Supabase once this RLS policy fix is applied!

## 🎯 Next Steps
1. Apply the SQL fix in Supabase dashboard immediately
2. Test admin user promotion functionality 
3. Verify all user role management features work correctly
4. Deploy the updated frontend if needed (though no frontend changes required)
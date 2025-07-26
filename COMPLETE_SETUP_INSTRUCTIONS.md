# Complete Setup Instructions: Fake Users & Email Verification

## 🚀 Quick Setup Guide

### Step 1: Populate Database with Fake Users

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/sql/new
   ```

2. **Run the populate script**:
   - Copy the entire contents of `populate-fake-users.sql`
   - Paste it into the SQL editor
   - Click "RUN"

3. **Expected Results**:
   - 128 total users will be created
   - 120 regular Taylor University students
   - 2 admin users
   - 3 PA (Personnel Assistant) users
   - 3 special test users (active, pending, blocked)

### Step 2: Enable Email Verification (2FA)

Since email confirmations are currently disabled in your Supabase config, here's how to enable them:

#### Option A: Enable in Supabase Dashboard (Recommended)

1. **Go to Authentication Settings**:
   ```
   https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/auth/email-templates
   ```

2. **Enable Email Confirmations**:
   - Go to "Providers" → "Email"
   - Toggle ON "Confirm email"
   - This will require users to verify their email before logging in

3. **Configure Email Templates**:
   - Customize the confirmation email template
   - Ensure the redirect URL points to your app

#### Option B: Test Email Flow Without Enabling Confirmations

For testing purposes, the app already handles email flows for:
- Password reset emails
- Account verification (when enabled)

### Step 3: Test User Accounts

After running the populate script, you'll have these test accounts:

#### Admin Accounts
| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@taylor.edu | admin123 | Admin | Active |
| superadmin@taylor.edu | (set in Supabase) | Admin | Active |

#### PA Accounts
| Email | Dorm | Wing | Status |
|-------|------|------|--------|
| jane.smith@taylor.edu | Olson Hall | Second East | Active |
| sarah.pa@taylor.edu | Wengatz Hall | Third West | Active |
| michael.pa@taylor.edu | Morris Hall | First Center | Active |

#### Sample Student Accounts
The script creates 120 students with emails like:
- emma.smith1@taylor.edu
- liam.johnson2@taylor.edu
- olivia.williams3@taylor.edu
- etc.

All distributed across 8 dorms and various wings.

### Step 4: Verify Admin Console Display

1. **Access the Admin Dashboard**:
   - Local: `http://localhost:5173/admin`
   - Deployed: `[your-domain]/admin`

2. **Login with**:
   - Email: `admin@taylor.edu`
   - Password: `admin123`

3. **You should see**:
   - User count badges showing total/active/pending users
   - User cards displaying:
     - Profile pictures (avatars)
     - Names and emails
     - Dorm and wing assignments
     - Status badges (active/pending/blocked)
     - Join dates
   - Search functionality to filter users
   - Edit capabilities for user profiles

### Step 5: Test Email Features

#### Password Reset Flow
1. On the login page, click "Forgot Password?"
2. Enter any test user email
3. Check the Supabase email logs for the reset link

#### Email Verification (if enabled)
1. Sign up a new user
2. Check email logs in Supabase
3. Click the verification link
4. User should be able to login after verification

### 📊 Database Statistics After Population

- **Total Users**: 128
- **By Status**:
  - Active: ~120 users
  - Pending: ~7 users
  - Blocked: 1 user
- **By Role**:
  - Admins: 2
  - PAs: 3
  - Regular Users: 123
- **Dorm Distribution**: Users evenly distributed across 8 Taylor University dorms

### 🔧 Troubleshooting

#### Users Don't Appear in Admin Console
1. Check browser console for errors
2. Refresh the page (data may need time to propagate)
3. Verify RLS policies are set (the script handles this)

#### Email Verification Issues
1. Check Supabase email logs: `Auth → Logs`
2. Ensure SMTP settings are configured if using custom SMTP
3. Verify redirect URLs are whitelisted in Supabase

#### Can't Login as Admin
1. The temporary bypass credentials are:
   - Email: `admin@taylor.edu`
   - Password: `admin123`
2. This works even without database users

### 📝 Notes

- The fake users are created with UUIDs that won't conflict with real auth users
- All users have realistic Taylor University dorm assignments
- Email patterns follow the format: `firstname.lastnameX@taylor.edu`
- The admin console fetches directly from the profiles table (no auth required for viewing)
- Email confirmations can be toggled on/off without affecting existing functionality
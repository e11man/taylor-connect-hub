# Resend Email Setup for Taylor Connect Hub

## Setup Instructions

### 1. Get Your Resend API Key

1. Go to [Resend.com](https://resend.com) and create an account
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://gzzbjifmrwvqbkwbyvhm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o

# Resend API Key for email verification
VITE_RESEND_API_KEY=re_your_actual_api_key_here

# Database URL (for server-side operations)
SUPABASE_DB_URL=postgresql://postgres.gzzbjifmrwvqbkwbyvhm:Idonotunderstandwhatido!@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

### 3. Verify Domain (Optional but Recommended)

For production use, verify your domain with Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `taylorconnecthub.com`)
3. Follow the DNS verification steps
4. Update the `from` email in `src/utils/emailService.ts` to use your verified domain

### 4. Test the Setup

1. Start your development server: `npm run dev`
2. Try creating a new account with a Taylor email
3. Check your email for the verification code
4. Enter the code to verify your account

## How It Works

1. **User Registration**: When a Taylor user creates an account, a 6-digit verification code is generated and stored in the database
2. **Email Sending**: The verification code is sent via Resend to the user's email
3. **Verification**: User enters the code in the 2FA verification screen
4. **Account Activation**: Upon successful verification, the user's status is changed to 'active' and they can sign in

## Security Features

- ✅ 6-digit verification codes
- ✅ Codes expire after 10 minutes (handled in UI)
- ✅ Secure password hashing with bcrypt
- ✅ No auto-login until verification
- ✅ Resend rate limiting and security

## Troubleshooting

### Email Not Sending
- Check your Resend API key is correct
- Verify the API key has proper permissions
- Check browser console for errors

### Verification Code Not Working
- Ensure the code is exactly 6 digits
- Check the database for the stored verification code
- Verify the user's email matches

### Environment Variables Not Loading
- Restart your development server after adding `.env` file
- Ensure variable names start with `VITE_` for client-side access 
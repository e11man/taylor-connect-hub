# Resend Email Verification Setup

This guide explains how to set up and test the custom email verification system using Resend.

## Prerequisites

1. **Get a Resend API Key**:
   - Sign up at [https://resend.com](https://resend.com)
   - Go to API Keys section
   - Create a new API key
   - Copy the key (it starts with `re_`)

2. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

## Setup Instructions

### 1. Set the RESEND_API_KEY in Supabase

Run this command with your actual Resend API key:

```bash
npx supabase secrets set RESEND_API_KEY=re_YOUR_ACTUAL_KEY_HERE
```

Or use our helper script:

```bash
./scripts/set-resend-key.sh re_YOUR_ACTUAL_KEY_HERE
```

### 2. Configure the Send Email Hook

1. Go to your Supabase dashboard
2. Navigate to Authentication → Hooks
3. Add a new "Send Email" hook with these settings:
   - Enable Send Email hook: ON
   - Hook type: HTTPS
   - URL endpoint: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-email`
   - Click "Generate secret" and save it

### 3. Set the Hook Secret

Set the generated secret in your environment:

```bash
npx supabase secrets set SEND_EMAIL_HOOK_SECRET=YOUR_SECRET_HERE
```

Note: Remove the `v1,whsec_` prefix from the secret before setting it.

### 4. Deploy the Edge Function

The edge function has already been created at `supabase/functions/send-email/index.ts`.

Deploy it to your Supabase project:

```bash
npx supabase functions deploy send-email --no-verify-jwt
```

### 5. Test the Email Verification

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Visit the test page**:
   - Open your browser to: `http://localhost:5173/test-email-verification`
   - The page will automatically trigger a test signup for `josh_ellman@taylor.edu`

3. **Check the email**:
   - Check the inbox for `josh_ellman@taylor.edu`
   - You should receive an email with a 6-digit verification code
   - The email will look like:
     ```
     Subject: Verify Your Email
     
     We sent a 6-digit code to
     josh_ellman@taylor.edu
     
     [123456]
     
     This code will expire in 10 minutes.
     ```

4. **Enter the code**:
   - Enter the 6-digit code in the verification screen
   - Click "Verify Email"
   - You should see a success message

## Troubleshooting

### Email not sending?

1. **Check the Edge Function logs**:
   ```bash
   npx supabase functions logs send-email
   ```

2. **Verify both secrets are set**:
   ```bash
   npx supabase secrets list
   ```
   You should see both `RESEND_API_KEY` and `SEND_EMAIL_HOOK_SECRET` in the list.

3. **Check Resend Dashboard**:
   - Log into your Resend account
   - Go to the "Emails" section to see sent emails
   - Check if the email was sent successfully

### Common Issues

- **"Email service not configured"**: The RESEND_API_KEY is not set properly
- **401 Unauthorized**: Your Resend API key is invalid
- **Email not received**: Check spam folder or verify the email address

## How It Works

1. **Send Email Hook**: When Supabase needs to send any authentication email (signup, password reset, etc.), it triggers our custom edge function instead of using its default email system.

2. **Edge Function**: The `send-email` function:
   - Receives the email details from Supabase (including the OTP code)
   - Formats a custom HTML email
   - Sends it via Resend API

3. **Verification**: The standard Supabase OTP verification flow remains unchanged - only the email sending is customized.

This ensures all authentication emails are reliably delivered via Resend, solving the issue where Supabase's default emails weren't being delivered.

## Production Setup

For production, make sure to:

1. Use a verified domain in Resend (not the default `onboarding@resend.dev`)
2. Set both `RESEND_API_KEY` and `SEND_EMAIL_HOOK_SECRET` in your production Supabase project
3. Update the "from" email in `supabase/functions/send-email/index.ts`
4. Configure the Send Email Hook in your production Supabase dashboard
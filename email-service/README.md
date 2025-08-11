# Email Service

This folder contains the email verification, password reset, and chat notification services for Taylor Connect Hub.

## Setup

1. Install Dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Environment Variables:
   Set these in your shell, `.env`, or deployment environment:
   ```bash
   export RESEND_API_KEY=...           # Required
   export DB_HOST=aws-0-us-east-2.pooler.supabase.com
   export DB_PORT=6543
   export DB_NAME=postgres
   export DB_USER=postgres.gzzbjifmrwvqbkwbyvhm
   export DB_PASSWORD=...              # Required for DB operations
   export RESEND_DELAY_SECONDS=0.5     # Optional: small delay for tests
   export RESEND_DELAY_MS=500          # Optional: per-email delay for notification sends
   export RESEND_BATCH_DELAY_MS=1500   # Optional: per-batch delay
   export TEST_RECIPIENT=you@example.com
   export TEST_NAME="Your Name"
   ```

   Notes:
   - API keys must NOT be hardcoded in code; use environment variables.
   - Use a monitored sender like `Taylor Connect Hub <info@ellmangroup.org>`.
   - Ensure SPF, DKIM, and DMARC are correctly published for `ellmangroup.org`.

## Usage

### Email Verification
```bash
source venv/bin/activate
python3 send_verification_email.py "user@example.com"
```

### Password Reset
```bash
source venv/bin/activate
python3 send_password_reset_email.py "user@example.com"
```

### Chat Notifications
```bash
source venv/bin/activate
python3 send_chat_notification_email.py
```

## Deliverability and Compliance

- Sender and Reply-To:
  - From: `Taylor Connect Hub <info@ellmangroup.org>` (monitored)
  - Reply-To: `info@ellmangroup.org`

- Headers:
  - Adds `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` to support safe unsubscribes.
  - Generates proper `Message-ID` via provider. Avoid overriding unless necessary.

- Content:
  - All emails now include both HTML and plain-text (`multipart/alternative`) via Resend API fields `html` and `text`.
  - Avoid spam trigger words; personalize subject/body using recipient name when possible.

- Unsubscribe/Preference Management:
  - Visible link in the footer to notification settings: `https://taylor-connect-hub.vercel.app/settings/notifications`.
  - `List-Unsubscribe` includes both `mailto:` and HTTPS one-click endpoint.

- Rate Limiting / Warm-up:
  - Scripts include gentle delays (`RESEND_DELAY_MS`, `RESEND_BATCH_DELAY_MS`) to avoid spikes on new domains/IPs.
  - Start with small daily volumes and ramp gradually.

- Authentication:
  - Verify SPF, DKIM, DMARC for `ellmangroup.org`.
  - Use the same authenticated domain in the From/Reply-To.

- Consent:
  - Only send to opted-in recipients; respect user preferences.

## Features

### Email Verification
- Generates 6-digit verification codes
- Sends professionally formatted HTML emails and text fallback
- Uses Resend email service
- Returns both success status and generated code
- Handles errors gracefully

### Password Reset
- Generates 6-digit reset codes
- Stores codes in database with 10-minute expiration
- Sends professionally formatted HTML emails and text fallback
- Includes database functions for verification and password updates

### Chat Notifications
- Sends emails when new chat messages are posted
- Respects user notification preferences (immediate, daily, weekly, never)
- Includes text fallback, Reply-To, and List-Unsubscribe headers
- Adds configurable rate limiting between sends
- Tracks notification status to prevent duplicates

## Integration

The service is integrated with:
- User registration flow
- Email verification components
- Password reset flow
- Chat messaging system
- Notification preferences management
- Database verification code storage
- Resend functionality
- Frontend password reset modals
- Event chat modals 
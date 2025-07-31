# Email Service

This folder contains the email verification service for Taylor Connect Hub.

## Setup

1. **Install Dependencies:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   - Set `RESEND_API_KEY` environment variable with your Resend API key
   - Or the script will use the default key from the code

## Usage

### Manual Testing
```bash
source venv/bin/activate
python3 send_verification_email.py "user@example.com"
```

### From Node.js/TypeScript
```typescript
import { sendVerificationCode } from '@/utils/emailService';

const result = await sendVerificationCode('user@example.com');
if (result.success) {
  console.log('Verification code:', result.code);
}
```

## Features

- Generates 6-digit verification codes
- Sends professionally formatted HTML emails
- Uses Resend email service
- Returns both success status and generated code
- Handles errors gracefully

## Email Template

The email includes:
- Taylor Connect Hub branding
- Clear 6-digit code display
- Security warnings
- Professional styling
- Mobile-responsive design

## Integration

The service is integrated with:
- User registration flow
- Email verification components
- Database verification code storage
- Resend functionality 
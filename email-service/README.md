# Email Service

This folder contains the email verification and password reset services for Taylor Connect Hub.

## Setup

1. **Install Dependencies:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   - Set `RESEND_API_KEY` environment variable with your Resend API key
   - Set database connection variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
   - Or the script will use the default keys from the code

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

### From Node.js/TypeScript
```typescript
import { sendVerificationCode } from '@/utils/emailService';
import { sendPasswordResetCode } from '@/utils/passwordResetService';

// Send verification code
const result = await sendVerificationCode('user@example.com');
if (result.success) {
  console.log('Verification code:', result.code);
}

// Send password reset code
const resetResult = await sendPasswordResetCode('user@example.com');
if (resetResult.success) {
  console.log('Password reset code sent');
}
```

## Features

### Email Verification
- Generates 6-digit verification codes
- Sends professionally formatted HTML emails
- Uses Resend email service
- Returns both success status and generated code
- Handles errors gracefully

### Password Reset
- Generates 6-digit reset codes
- Stores codes in database with 10-minute expiration
- Sends professionally formatted HTML emails
- Includes database functions for verification and password updates
- Secure password reset flow with code verification

## Email Templates

### Verification Email
The verification email includes:
- Taylor Connect Hub branding
- Clear 6-digit code display
- Security warnings
- Professional styling
- Mobile-responsive design

### Password Reset Email
The password reset email includes:
- Taylor Connect Hub branding
- Clear 6-digit reset code display
- Security warnings about code expiration
- Professional styling
- Mobile-responsive design

## Database Integration

### Password Reset Functions
The service integrates with database functions:
- `update_password_with_reset_code()` - Updates password using reset code
- `verify_reset_code()` - Verifies reset code without updating password
- `clear_reset_code()` - Clears reset code after successful reset

### Security Features
- 10-minute expiration on reset codes
- Automatic code cleanup after password update
- Secure database functions with proper error handling
- Client-side bcrypt password hashing

## Integration

The service is integrated with:
- User registration flow
- Email verification components
- Password reset flow
- Database verification code storage
- Resend functionality
- Frontend password reset modals 
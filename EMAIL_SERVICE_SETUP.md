# Email Service Setup for Taylor Connect Hub

## Overview

The email service has been updated to use the Python script `send_verification_email.py` instead of the direct Resend API. This provides better error handling and more control over the email sending process.

## Architecture

1. **Frontend** (`src/utils/emailService.ts`) - Calls the Node.js server endpoint
2. **Node.js Server** (`server.js`) - Receives requests and calls the Python script
3. **Python Script** (`email-service/send_verification_email.py`) - Handles the actual email sending via Resend

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd email-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Resend API Key
RESEND_API_KEY=re_your_actual_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the Email Server

```bash
# Start the email server only
npm run email-server

# Or start both frontend and email server
npm run dev:full
```

The email server will run on `http://localhost:3001`.

## Usage

### Account Creation Flow

1. User fills out signup form
2. `registerUser()` function in `directAuth.ts` is called
3. For Taylor users, a verification code is generated and stored in the database
4. `sendVerificationCode()` is called with the email and code
5. Frontend calls the Node.js server endpoint
6. Server calls the Python script with the email and code
7. Python script sends the email via Resend
8. User receives verification email with the code

### API Endpoints

#### POST `/api/send-verification-code`

Sends a verification email using the Python script.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"  // Optional - if not provided, Python script generates one
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "code": "123456"
}
```

#### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Email server is running"
}
```

## Testing

### Test the Email Service

```bash
# Start the email server
npm run email-server

# In another terminal, run the test
node test_email_integration.js
```

### Manual Testing

1. Start the email server: `npm run email-server`
2. Create a new account with a Taylor email address
3. Check your email for the verification code
4. Enter the code in the verification screen

## Troubleshooting

### Common Issues

1. **Email server not running**
   - Error: "Failed to fetch"
   - Solution: Start the email server with `npm run email-server`

2. **Python script not found**
   - Error: "Failed to start Python process"
   - Solution: Ensure Python 3 is installed and the script path is correct

3. **Resend API key issues**
   - Error: "Failed to send verification email"
   - Solution: Check your Resend API key and domain verification

4. **CORS issues**
   - Error: "CORS policy blocked"
   - Solution: The server includes CORS middleware, but ensure the frontend is calling the correct URL

### Debug Mode

To see detailed logs, check the server console output when running `npm run email-server`.

## Security Notes

- The Resend API key is stored server-side only
- Email verification codes expire after 10 minutes
- The Python script includes security warnings in the email template
- All email sending is logged for debugging purposes

## Deployment

For production deployment:

1. Update the server URL in `emailService.ts` to point to your production server
2. Ensure the Python script is available on the production server
3. Set up proper environment variables
4. Configure your domain with Resend
5. Update the "from" email address in the Python script 
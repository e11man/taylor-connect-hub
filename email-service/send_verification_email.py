import resend
import os
import sys
import random
import string

# Get API key from environment variable
resend.api_key = os.getenv('RESEND_API_KEY', '')
if not resend.api_key:
    raise RuntimeError('RESEND_API_KEY is not set')

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, verification_code):
    """Send verification email with 6-digit code"""
    try:
        params = {
            "from": "Taylor Connect Hub <info@ellmangroup.org>",
            "to": [email],
            "subject": "Your Taylor Connect Hub verification code",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00AFCE 0%, #0077B6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Taylor Connect Hub</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Account Verification</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <p style="color: #666; line-height: 1.6;">Use this code to verify your email address:</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #00AFCE; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            {verification_code}
                        </div>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This code expires in 10 minutes.</p>
                    </div>
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">If you did not request this, you can ignore this message.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 Taylor Connect Hub. All rights reserved.</p>
                    <p>This email was sent to {email}</p>
                </div>
            </div>
            """,
            "text": f"Your Taylor Connect Hub verification code is {verification_code}. It expires in 10 minutes. If you did not request this, you can ignore this message.",
            "reply_to": "info@ellmangroup.org",
            "headers": {
                "List-Unsubscribe": "<mailto:unsubscribe@ellmangroup.org>, <https://taylor-connect-hub.vercel.app/settings/notifications>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
            }
        }

        print(f"Sending verification email to: {email}")
        email_response = resend.Emails.send(params)
        print("Email sent successfully:", email_response)
        return True

    except Exception as e:
        print("Error type:", type(e).__name__)
        print("Error message:", str(e))
        if hasattr(e, 'code'):
            print(f"Error code: {e.code}")
        if hasattr(e, 'error_type'):
            print(f"Error type: {e.error_type}")
        
        print("\n--- SOLUTIONS ---")
        print("1. Verify your domain at https://resend.com/domains")
        print("2. Check your API key permissions")
        print("3. Contact Resend support if the issue persists")
        return False

if __name__ == "__main__":
    # Get email from command line argument or use default
    email = sys.argv[1] if len(sys.argv) > 1 else "josh_ellman@icloud.com"
    
    # Get verification code from command line argument or generate one
    verification_code = sys.argv[2] if len(sys.argv) > 2 else generate_verification_code()
    
    # Send email
    success = send_verification_email(email, verification_code)
    
    if success:
        print(f"Verification code {verification_code} sent to {email}")
        # Output the code so it can be captured by the calling process
        print(f"CODE:{verification_code}")
    else:
        print(f"Failed to send verification email to {email}")
        sys.exit(1) 
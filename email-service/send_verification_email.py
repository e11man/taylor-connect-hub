import resend
import os
import sys
import random
import string

# Get API key from environment variable or use default
resend.api_key = os.getenv('RESEND_API_KEY', "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92")

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, verification_code):
    """Send verification email with 6-digit code""" 
    # dont mask as tayllr univerty 
    try:
        params = {
            "from": "acme <noreply@ellmangroup.org>",
            "to": [email],
            "subject": "Verify Your Taylor Connect Hub Account",
            "html": f"<p>Code: {verification_code}</p>"
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
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
            "from": "Main Street Connect <noreply@uplandmainstreet.org>",
            "to": [email],
            "subject": "Verify Your Main Street Connect Account",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1B365F; margin: 0; font-size: 28px; font-weight: 600;">Main Street Connect</h1>
                    <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Account Verification</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for creating your Main Street Connect account!
                    </p>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your verification code is: <strong style="color: #E14F3D; font-size: 18px;">{verification_code}</strong>
                    </p>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Enter this code to complete your registration. This code expires in 10 minutes.
                    </p>
                    
                    <div style="background: #E14F3D; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px; font-weight: 600;">Verification Code: {verification_code}</p>
                    </div>
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">If you didn't create this account, you can safely ignore this email.</p>
                </div>
                
                <div style="border-top: 2px solid #E14F3D; margin-top: 30px; padding-top: 20px; text-align: center;">
                    <p style="color: #1B365F; margin: 0; font-size: 18px; font-weight: 600;">Main Street Connect</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Connecting communities through meaningful volunteer opportunities</p>
                </div>
            </div>
            """
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
import resend
import time

resend.api_key = "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92"

# Wait a moment to avoid rate limiting
time.sleep(1)

# Using your verified domain ellmangroup.org
params = {
    "from": "Taylor Connect <noreply@ellmangroup.org>",  # Using your verified domain
    "to": ["josh_ellman@icloud.com"],
    "subject": "Taylor Connect Test",
    "html": "<p>This is a test email from Taylor Connect Hub</p>"
}

try:
    print("Sending email...")
    email = resend.Emails.send(params)
    print("Success:", email)
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
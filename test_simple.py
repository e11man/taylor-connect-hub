import resend
import time
import os

# Use env var for API key
resend.api_key = os.getenv('RESEND_API_KEY', '')
if not resend.api_key:
    raise RuntimeError('RESEND_API_KEY is not set')

# Wait a moment to avoid rate limiting
TIME_DELAY_SEC = float(os.getenv('RESEND_DELAY_SECONDS', '0.5'))

time.sleep(TIME_DELAY_SEC)

# Using verified domain ellmangroup.org
recipient = os.getenv('TEST_RECIPIENT', 'josh_ellman@icloud.com')
recipient_name = os.getenv('TEST_NAME', 'there')

params = {
    "from": "Taylor Connect Hub <info@ellmangroup.org>",
    "to": [recipient],
    "subject": f"Taylor Connect Hub update for {recipient_name}",
    "html": f"""
        <p>Hi {recipient_name},</p>
        <p>This is a quick test from Taylor Connect Hub.</p>
        <p>You can manage your notification preferences in your account settings.</p>
        <p style=\"font-size:12px;color:#667\">If you no longer wish to receive these messages, <a href=\"https://taylor-connect-hub.vercel.app/settings/notifications\">unsubscribe here</a>.</p>
    """,
    "text": f"Hi {recipient_name},\n\nThis is a quick test from Taylor Connect Hub.\n\nManage your notifications: https://taylor-connect-hub.vercel.app/settings/notifications\n\nIf you no longer wish to receive these messages, unsubscribe at the link above.",
    "reply_to": "info@ellmangroup.org",
    "headers": {
        "List-Unsubscribe": "<mailto:unsubscribe@ellmangroup.org>, <https://taylor-connect-hub.vercel.app/settings/notifications>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    }
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
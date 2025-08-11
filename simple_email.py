import resend
import os

# Use environment variable for API key
resend.api_key = os.getenv("RESEND_API_KEY", "")

if not resend.api_key:
    raise RuntimeError("RESEND_API_KEY is not set")

params: resend.Emails.SendParams = {
  "from": "Taylor Connect Hub <info@ellmangroup.org>",
  "to": [os.getenv("TEST_RECIPIENT", "josh_ellman@taylor.edu")],
  "subject": f"Hello {os.getenv('TEST_NAME', 'there')} from Taylor Connect Hub",
  "html": "<p>Hi {name},</p><p>Just checking in.</p><p>Manage notifications in your account settings.</p>".replace("{name}", os.getenv("TEST_NAME", "there")),
  "text": "Hi {name},\n\nJust checking in.\n\nManage notifications in your account settings: https://taylor-connect-hub.vercel.app/settings/notifications\n".replace("{name}", os.getenv("TEST_NAME", "there")),
  "reply_to": "info@ellmangroup.org",
  "headers": {
    "List-Unsubscribe": "<mailto:unsubscribe@ellmangroup.org>, <https://taylor-connect-hub.vercel.app/settings/notifications>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  },
}

email = resend.Emails.send(params)
print(email)
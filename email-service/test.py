import resend
import os

resend.api_key = os.getenv('RESEND_API_KEY', "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92")

params: resend.Emails.SendParams = {
  "from": "Acme <noreply@ellmangroup.org>",
  "to": ["ella_boyce@taylor.edu"],
  "subject": "hello world",
  "html": "<p>it works!</p>"
}

email = resend.Emails.send(params)
print(email)
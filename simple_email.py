import resend

resend.api_key = "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92"

params: resend.Emails.SendParams = {
  "from": "Taylor Connect <noreply@ellmangroup.org>",
  "to": ["josh_ellman@taylor.edu"],
  "subject": "hello world",
  "html": "<p>it works!</p>"
}

email = resend.Emails.send(params)
print(email)
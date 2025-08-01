# Contact Form Handler

This script handles contact form submissions and sends beautifully formatted emails via Resend to josh_ellman@icloud.com.

## Setup

1. **Install Dependencies:**
   ```bash
   cd database-service
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   Create a `.env` file in the database-service folder with:
   ```bash
   RESEND_API_KEY=your_resend_api_key_here
   ```

3. **Update Email Configuration:**
   In `contact_form_handler.py`, update:
   - `from_email`: Your verified domain (e.g., "noreply@yourdomain.com")
   - `to_email`: Currently set to "josh_ellman@icloud.com"

## Usage

### Interactive Mode (Recommended)
```bash
cd database-service
source venv/bin/activate
python contact_form_handler.py
```

This will start an interactive menu where you can:
- Send test emails
- Send contact form emails manually
- Verify the email formatting

### Command Line Mode

**Send test email:**
```bash
python contact_form_handler.py test
```

**Send contact form email:**
```bash
python contact_form_handler.py send "John Doe" "john@example.com" "Hello, I have a question about volunteering."
```

## Email Format

The emails are beautifully formatted with:
- **Header**: Community Connect branding with gradient background
- **Contact Information**: Name, email, and timestamp
- **Message Section**: The actual message content
- **Footer**: Site branding and timestamp
- **Theme Colors**: Uses the site's blue theme (#00AFCE)

## Integration with Frontend

To integrate this with your frontend contact form:

1. **Create an API endpoint** that calls this script
2. **Send POST requests** with name, email, and message
3. **Handle responses** appropriately

Example API integration:
```python
# In your API endpoint
from contact_form_handler import ContactFormHandler

def handle_contact_form(request):
    handler = ContactFormHandler()
    success = handler.send_contact_email(
        name=request.json['name'],
        email=request.json['email'],
        message=request.json['message']
    )
    return {'success': success}
```

## Features

- ✅ Beautiful HTML email formatting
- ✅ Site theme integration
- ✅ Contact information display
- ✅ Timestamp tracking
- ✅ Error handling
- ✅ Interactive and command-line modes
- ✅ Test email functionality
- ✅ Professional branding

## Email Preview

The emails include:
- 🤝 Community Connect logo
- 📋 Contact information section
- 💬 Message content
- 📅 Timestamp
- 🎨 Professional styling with site colors

## Troubleshooting

1. **API Key Issues**: Make sure your Resend API key is valid
2. **Domain Verification**: Ensure your from_email domain is verified in Resend
3. **Rate Limits**: Resend has rate limits, check their documentation
4. **Email Delivery**: Check spam folders if emails aren't received

## Security Notes

- Store API keys in environment variables
- Validate input data before sending
- Consider rate limiting for production use
- Monitor email delivery rates 
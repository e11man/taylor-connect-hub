#!/usr/bin/env python3
"""
Contact Form Handler for Taylor Connect Hub
Handles contact form submissions and sends formatted emails via Resend
"""

import os
import sys
import json
import requests
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ContactFormHandler:
    def __init__(self, production_mode=False):
        self.resend_api_key = os.getenv('RESEND_API_KEY', 're_1234567890abcdef')  # Replace with your actual key
        
        if production_mode:
            # For production - requires verified domain
            self.from_email = "noreply@uplandmainstreet.org"  # Update with your verified domain
            self.to_email = "hello@uplandmainstreet.org"
        else:
            # For testing - uses Resend's default sender
            self.from_email = "noreply@uplandmainstreet.org"
            self.to_email = "joshalanellman@gmail.com"  # Use your verified email for testing
        
        self.headers = {
            'Authorization': f'Bearer {self.resend_api_key}',
            'Content-Type': 'application/json'
        }
        
        print("✅ Contact Form Handler initialized")
        print(f"🔑 Using API key: {self.resend_api_key[:10]}...")
        print(f"📧 From: {self.from_email}")
        print(f"📧 To: {self.to_email}")
    
    def send_contact_email(self, name: str, email: str, message: str) -> bool:
        """Send a formatted contact form email"""
        try:
            # Create the email HTML content
            html_content = self._create_email_html(name, email, message)
            
            # Prepare the email data
            email_data = {
                "from": self.from_email,
                "to": [self.to_email],
                "subject": f"New Contact Form Submission - {name}",
                "html": html_content
            }
            
            # Send the email via Resend API
            response = requests.post(
                "https://api.resend.com/emails",
                headers=self.headers,
                json=email_data
            )
            
            response.raise_for_status()
            result = response.json()
            
            print(f"✅ Contact form email sent successfully!")
            print(f"   From: {name} ({email})")
            print(f"   Message ID: {result.get('id', 'N/A')}")
            return True
            
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP Error sending contact email: {e}")
            if e.response is not None:
                print(f"   Status Code: {e.response.status_code}")
                print(f"   Response: {e.response.text}")
            return False
        except Exception as e:
            print(f"❌ Error sending contact email: {e}")
            return False
    
    def _create_email_html(self, name: str, email: str, message: str) -> str:
        """Create a nicely formatted HTML email with the site's theme"""
        
        # Get current timestamp
        timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f8fafc;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #00AFCE 0%, #0088a9 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .info-section {{
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 25px;
                }}
                .info-section h3 {{
                    color: #00AFCE;
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                }}
                .info-item {{
                    margin-bottom: 12px;
                }}
                .info-label {{
                    font-weight: 600;
                    color: #555;
                    display: inline-block;
                    width: 80px;
                }}
                .info-value {{
                    color: #333;
                }}
                .message-section {{
                    background-color: #fff;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }}
                .message-section h3 {{
                    color: #00AFCE;
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 600;
                }}
                .message-content {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #00AFCE;
                    white-space: pre-wrap;
                    line-height: 1.5;
                }}
                .footer {{
                    background-color: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }}
                .footer p {{
                    margin: 0;
                    color: #6c757d;
                    font-size: 14px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .timestamp {{
                    color: #6c757d;
                    font-size: 12px;
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #e9ecef;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🤝 Community Connect</div>
                    <h1>New Contact Form Submission</h1>
                    <p>Someone has reached out through the website contact form</p>
                </div>
                
                <div class="content">
                    <div class="info-section">
                        <h3>📋 Contact Information</h3>
                        <div class="info-item">
                            <span class="info-label">Name:</span>
                            <span class="info-value">{name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date:</span>
                            <span class="info-value">{timestamp}</span>
                        </div>
                    </div>
                    
                    <div class="message-section">
                        <h3>💬 Message</h3>
                        <div class="message-content">{message}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Community Connect</strong></p>
                    <p>Fostering meaningful relationships between passionate volunteers and impactful opportunities</p>
                    <div class="timestamp">
                        This message was sent from the Community Connect contact form on {timestamp}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def test_email(self) -> bool:
        """Send a test email to verify the setup"""
        try:
            test_data = {
                "name": "Test User",
                "email": "test@example.com",
                "message": "This is a test message to verify that the contact form email system is working correctly."
            }
            
            return self.send_contact_email(**test_data)
            
        except Exception as e:
            print(f"❌ Error sending test email: {e}")
            return False
    
    def interactive_mode(self):
        """Run interactive contact form handler"""
        print("\n📧 Contact Form Handler Interactive Mode")
        print("=" * 50)
        
        while True:
            print("\nOptions:")
            print("1. Send test email")
            print("2. Send contact form email")
            print("3. Exit")
            
            choice = input("\nEnter your choice (1-3): ").strip()
            
            if choice == '1':
                print("\nSending test email...")
                success = self.test_email()
                if success:
                    print("✅ Test email sent successfully!")
                else:
                    print("❌ Failed to send test email")
            
            elif choice == '2':
                print("\nEnter contact form details:")
                name = input("Name: ").strip()
                email = input("Email: ").strip()
                message = input("Message: ").strip()
                
                if name and email and message:
                    print(f"\nSending contact form email from {name}...")
                    success = self.send_contact_email(name, email, message)
                    if success:
                        print("✅ Contact form email sent successfully!")
                    else:
                        print("❌ Failed to send contact form email")
                else:
                    print("❌ All fields are required")
            
            elif choice == '3':
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice. Please enter 1-3.")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1]
        
        # Check for production mode flag
        production_mode = '--production' in sys.argv
        if production_mode:
            sys.argv.remove('--production')
        
        handler = ContactFormHandler(production_mode=production_mode)
        
        try:
            if command == 'test':
                success = handler.test_email()
                sys.exit(0 if success else 1)
            elif command == 'send':
                if len(sys.argv) < 5:
                    print("Usage: python contact_form_handler.py send <name> <email> <message> [--production]")
                    sys.exit(1)
                name = sys.argv[2]
                email = sys.argv[3]
                message = sys.argv[4]
                success = handler.send_contact_email(name, email, message)
                sys.exit(0 if success else 1)
            else:
                print("Unknown command. Use: test, send, or interactive")
                sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)
    else:
        # Interactive mode
        handler = ContactFormHandler()
        handler.interactive_mode()

if __name__ == "__main__":
    main() 
import resend
import os
import sys
import random
import string
import psycopg2
from datetime import datetime, timedelta, timezone

# Get API key from environment variable
resend.api_key = os.getenv('RESEND_API_KEY', '')
if not resend.api_key:
    raise RuntimeError('RESEND_API_KEY is not set')

def generate_reset_code():
    """Generate a 6-digit reset code"""
    return ''.join(random.choices(string.digits, k=6))

def get_db_connection():
    """Get database connection"""
    try:
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST', 'aws-0-us-east-2.pooler.supabase.com'),
            port=os.getenv('DB_PORT', '6543'),
            database=os.getenv('DB_NAME', 'postgres'),
            user=os.getenv('DB_USER', 'postgres.gzzbjifmrwvqbkwbyvhm'),
            password=os.getenv('DB_PASSWORD', ''),
            connect_timeout=10
        )
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def store_reset_code(email, reset_code):
    """Store the reset code in the database with expiration"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Set expiration time (10 minutes from now)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Update the profiles table with reset code and expiration
        cursor.execute("""
            UPDATE profiles 
            SET verification_code = %s, updated_at = %s
            WHERE email = %s
        """, (reset_code, expires_at, email))
        
        if cursor.rowcount == 0:
            print(f"No user found with email: {email}")
            return False
        
        connection.commit()
        print(f"Reset code stored for {email}")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def send_password_reset_email(email, reset_code):
    """Send password reset email with 6-digit code"""
    try:
        params = {
            "from": "Taylor Connect Hub <info@ellmangroup.org>",
            "to": [email],
            "subject": "Your Taylor Connect Hub password reset code",
            "html": f"""
            <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">
                <div style=\"background: linear-gradient(135deg, #00AFCE 0%, #0077B6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;\">
                    <h1 style=\"color: white; margin: 0; font-size: 24px;\">Taylor Connect Hub</h1>
                    <p style=\"color: white; margin: 10px 0 0 0; opacity: 0.9;\">Password Reset</p>
                </div>
                <div style=\"background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\">
                    <p style=\"color: #666; line-height: 1.6; margin-bottom: 25px;\">Use this code to reset your password:</p>
                    <div style=\"background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;\">
                        <div style=\"font-size: 32px; font-weight: bold; color: #00AFCE; letter-spacing: 8px; font-family: 'Courier New', monospace;\">
                            {reset_code}
                        </div>
                        <p style=\"color: #666; margin: 10px 0 0 0; font-size: 14px;\">This code expires in 10 minutes.</p>
                    </div>
                    <p style=\"color: #666; line-height: 1.6; font-size: 14px;\">If you did not request this, you can ignore this message.</p>
                </div>
                <div style=\"text-align: center; margin-top: 20px; color: #999; font-size: 12px;\">
                    <p>© 2024 Taylor Connect Hub. All rights reserved.</p>
                    <p>This email was sent to {email}</p>
                </div>
            </div>
            """,
            "text": f"Your Taylor Connect Hub password reset code is {reset_code}. It expires in 10 minutes. If you did not request this, you can ignore this message.",
            "reply_to": "info@ellmangroup.org",
            "headers": {
                "List-Unsubscribe": "<mailto:unsubscribe@ellmangroup.org>, <https://taylor-connect-hub.vercel.app/settings/notifications>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
            }
        }

        print(f"Sending password reset email to: {email}")
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

def verify_reset_code(email, reset_code):
    """Verify the reset code from the database"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Check if the code matches and hasn't expired
        cursor.execute("""
            SELECT id FROM profiles 
            WHERE email = %s AND verification_code = %s AND updated_at > %s
        """, (email, reset_code, datetime.now(timezone.utc) - timedelta(minutes=10)))
        
        result = cursor.fetchone()
        return result is not None
        
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        connection.close()

def clear_reset_code(email):
    """Clear the reset code after successful password reset"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE profiles 
            SET verification_code = NULL, updated_at = %s
            WHERE email = %s
        """, (datetime.now(timezone.utc), email))
        
        connection.commit()
        print(f"Reset code cleared for {email}")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def update_password(email, new_password_hash):
    """Update the user's password hash"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE profiles 
            SET password_hash = %s, verification_code = NULL, updated_at = %s
            WHERE email = %s
        """, (new_password_hash, datetime.now(timezone.utc), email))
        
        if cursor.rowcount == 0:
            print(f"No user found with email: {email}")
            return False
        
        connection.commit()
        print(f"Password updated for {email}")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

if __name__ == "__main__":
    # Get email from command line argument or use default
    email = sys.argv[1] if len(sys.argv) > 1 else "josh_ellman@icloud.com"
    
    # Get reset code from command line argument or generate one
    reset_code = sys.argv[2] if len(sys.argv) > 2 else generate_reset_code()
    
    # Store the reset code in the database
    if store_reset_code(email, reset_code):
        # Send email
        success = send_password_reset_email(email, reset_code)
        
        if success:
            print(f"Password reset code {reset_code} sent to {email}")
            # Output the code so it can be captured by the calling process
            print(f"CODE:{reset_code}")
        else:
            print(f"Failed to send password reset email to {email}")
            sys.exit(1)
    else:
        print(f"Failed to store reset code for {email}")
        sys.exit(1) 
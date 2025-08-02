import resend
import os
import sys
import random
import string
import psycopg2
from datetime import datetime, timedelta, timezone

# Get API key from environment variable or use default
resend.api_key = os.getenv('RESEND_API_KEY', "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92")

# Database connection
DB_HOST = os.getenv('DB_HOST', 'aws-0-us-east-2.pooler.supabase.com')
DB_PORT = os.getenv('DB_PORT', '6543')
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = os.getenv('DB_USER', 'postgres.gzzbjifmrwvqbkwbyvhm')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'Idonotunderstandwhatido!')

def generate_reset_code():
    """Generate a 6-digit reset code"""
    return ''.join(random.choices(string.digits, k=6))

def get_db_connection():
    """Get database connection"""
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def store_organization_reset_code(email, reset_code):
    """Store the reset code in the database for organization accounts"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Set expiration time (10 minutes from now)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Check if this is an organization account
        cursor.execute("""
            SELECT p.id, p.user_type, o.name 
            FROM profiles p
            LEFT JOIN organizations o ON o.user_id = p.id
            WHERE p.email = %s AND p.user_type = 'organization'
        """, (email,))
        
        result = cursor.fetchone()
        if not result:
            print(f"No organization found with email: {email}")
            return False
        
        profile_id, user_type, org_name = result
        
        # Update the profiles table with reset code and expiration
        cursor.execute("""
            UPDATE profiles 
            SET verification_code = %s, updated_at = %s
            WHERE id = %s
        """, (reset_code, expires_at, profile_id))
        
        connection.commit()
        print(f"Reset code stored for organization {org_name} ({email})")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def send_organization_password_reset_email(email, reset_code, org_name=None):
    """Send password reset email with 6-digit code for organizations"""
    try:
        params = {
            "from": "Taylor Connect <noreply@ellmangroup.org>",
            "to": [email],
            "subject": "Reset Your Organization Password - Taylor Connect Hub",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00AFCE 0%, #0077B6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Taylor Connect Hub</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Organization Password Reset</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">Reset Your Organization Password</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                        We received a request to reset the password for your organization account{f" ({org_name})" if org_name else ""}. To proceed with the password reset, please enter the verification code below:
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #00AFCE; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            {reset_code}
                        </div>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Your 6-digit reset code</p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Enter this code in the password reset screen to create a new password for your organization account. This code will expire in 10 minutes.
                    </p>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #00AFCE; margin: 20px 0;">
                        <p style="color: #0056b3; margin: 0; font-size: 14px;">
                            <strong>Security Note:</strong> Never share this code with anyone. Taylor Connect Hub will never ask for this code via phone or email. If you didn't request this password reset, you can safely ignore this email.
                        </p>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6; margin-top: 25px; font-size: 14px;">
                        If you didn't request this password reset, your organization account is secure and no action is needed.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 Taylor Connect Hub. All rights reserved.</p>
                    <p>This email was sent to {email}</p>
                </div>
            </div>
            """
        }

        print(f"Sending organization password reset email to: {email}")
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

def verify_organization_reset_code(email, reset_code):
    """Verify the reset code from the database for organization accounts"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Check if the code matches and hasn't expired for organization accounts
        cursor.execute("""
            SELECT p.id FROM profiles p
            WHERE p.email = %s 
                AND p.verification_code = %s 
                AND p.updated_at > %s
                AND p.user_type = 'organization'
        """, (email, reset_code, datetime.now(timezone.utc) - timedelta(minutes=10)))
        
        result = cursor.fetchone()
        return result is not None
        
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        connection.close()

def clear_organization_reset_code(email):
    """Clear the reset code after successful password reset for organization accounts"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE profiles 
            SET verification_code = NULL, updated_at = %s
            WHERE email = %s AND user_type = 'organization'
        """, (datetime.now(timezone.utc), email))
        
        connection.commit()
        print(f"Reset code cleared for organization {email}")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def update_organization_password(email, new_password_hash):
    """Update the organization's password hash"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE profiles 
            SET password_hash = %s, verification_code = NULL, updated_at = %s
            WHERE email = %s AND user_type = 'organization'
        """, (new_password_hash, datetime.now(timezone.utc), email))
        
        if cursor.rowcount == 0:
            print(f"No organization found with email: {email}")
            return False
        
        connection.commit()
        print(f"Password updated for organization {email}")
        return True
        
    except Exception as e:
        print(f"Database error: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

if __name__ == "__main__":
    # Get email from command line argument or use default
    email = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    
    # Get reset code from command line argument or generate one
    reset_code = sys.argv[2] if len(sys.argv) > 2 else generate_reset_code()
    
    # Store the reset code in the database
    if store_organization_reset_code(email, reset_code):
        # Get organization name for email
        connection = get_db_connection()
        org_name = None
        if connection:
            try:
                cursor = connection.cursor()
                cursor.execute("""
                    SELECT o.name FROM profiles p
                    LEFT JOIN organizations o ON o.user_id = p.id
                    WHERE p.email = %s AND p.user_type = 'organization'
                """, (email,))
                result = cursor.fetchone()
                if result:
                    org_name = result[0]
            except Exception as e:
                print(f"Error getting organization name: {e}")
            finally:
                connection.close()
        
        # Send email
        success = send_organization_password_reset_email(email, reset_code, org_name)
        
        if success:
            print(f"Organization password reset code {reset_code} sent to {email}")
            # Output the code so it can be captured by the calling process
            print(f"CODE:{reset_code}")
        else:
            print(f"Failed to send organization password reset email to {email}")
            sys.exit(1)
    else:
        print(f"Failed to store reset code for organization {email}")
        sys.exit(1) 
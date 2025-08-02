import resend
import os
import sys
import psycopg2
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional

# Get API key from environment variable or use default
resend.api_key = os.getenv('RESEND_API_KEY', "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92")

# Database connection
DB_HOST = os.getenv('DB_HOST', 'aws-0-us-east-2.pooler.supabase.com')
DB_PORT = os.getenv('DB_PORT', '6543')
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = os.getenv('DB_USER', 'postgres.gzzbjifmrwvqbkwbyvhm')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'Idonotunderstandwhatido!')

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

def get_pending_notifications():
    """Get pending notifications that need to be sent"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
        
        # Get notifications that are scheduled to be sent now or in the past
        cursor.execute("""
            SELECT 
                n.id,
                n.user_id,
                n.event_id,
                n.chat_message_id,
                n.notification_type,
                n.scheduled_for,
                cm.message,
                cm.is_anonymous,
                cm.user_id as sender_user_id,
                cm.organization_id as sender_org_id,
                e.title as event_title,
                e.description as event_description,
                p.email as user_email,
                p.dorm as user_dorm,
                p.wing as user_wing,
                org.name as org_name,
                sender_org.name as sender_org_name,
                sender_user.email as sender_email
            FROM notifications n
            JOIN chat_messages cm ON n.chat_message_id = cm.id
            JOIN events e ON n.event_id = e.id
            JOIN profiles p ON n.user_id = p.id
            LEFT JOIN organizations org ON e.organization_id = org.id
            LEFT JOIN organizations sender_org ON cm.organization_id = sender_org.id
            LEFT JOIN profiles sender_user ON cm.user_id = sender_user.id
            WHERE n.sent_at IS NULL 
                AND n.scheduled_for <= %s
                AND n.notification_type = 'chat_message'
        """, (datetime.now(timezone.utc),))
        
        notifications = []
        for row in cursor.fetchall():
            notifications.append({
                'id': row[0],
                'user_id': row[1],
                'event_id': row[2],
                'chat_message_id': row[3],
                'notification_type': row[4],
                'scheduled_for': row[5],
                'message': row[6],
                'is_anonymous': row[7],
                'sender_user_id': row[8],
                'sender_org_id': row[9],
                'event_title': row[10],
                'event_description': row[11],
                'user_email': row[12],
                'user_dorm': row[13],
                'user_wing': row[14],
                'org_name': row[15],
                'sender_org_name': row[16],
                'sender_email': row[17]
            })
        
        return notifications
        
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        connection.close()

def get_user_notification_preferences(user_id: str) -> Dict:
    """Get user's notification preferences"""
    connection = get_db_connection()
    if not connection:
        return {'email_frequency': 'immediate', 'chat_notifications': True}
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT email_frequency, chat_notifications, event_updates
            FROM notification_preferences
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        if result:
            return {
                'email_frequency': result[0],
                'chat_notifications': result[1],
                'event_updates': result[2]
            }
        else:
            # Default preferences
            return {
                'email_frequency': 'immediate',
                'chat_notifications': True,
                'event_updates': True
            }
        
    except Exception as e:
        print(f"Database error getting preferences: {e}")
        return {'email_frequency': 'immediate', 'chat_notifications': True}
    finally:
        connection.close()

def should_send_notification(user_id: str, event_id: str, message_id: str) -> bool:
    """Check if we should send a notification based on user preferences and recent activity"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Get user preferences
        preferences = get_user_notification_preferences(user_id)
        
        # If chat notifications are disabled, don't send
        if not preferences.get('chat_notifications', True):
            return False
        
        # Check if we've already sent a notification for this message to this user
        cursor.execute("""
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = %s AND chat_message_id = %s AND email_sent = true
        """, (user_id, message_id))
        
        if cursor.fetchone()[0] > 0:
            return False
        
        # For immediate notifications, always send
        if preferences.get('email_frequency') == 'immediate':
            return True
        
        # For daily/weekly, check if we've sent one recently
        if preferences.get('email_frequency') in ['daily', 'weekly']:
            # Check if we've sent a notification for this event in the last 24 hours
            cursor.execute("""
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = %s AND event_id = %s AND email_sent = true 
                AND sent_at > %s
            """, (user_id, event_id, datetime.now(timezone.utc) - timedelta(hours=24)))
            
            if cursor.fetchone()[0] > 0:
                return False
        
        return True
        
    except Exception as e:
        print(f"Database error checking notification: {e}")
        return False
    finally:
        connection.close()

def send_chat_notification_email(notification: Dict) -> bool:
    """Send chat notification email"""
    try:
        # Determine sender information
        sender_name = "Anonymous"
        sender_type = "volunteer"
        
        if notification['sender_org_id']:
            sender_name = notification['sender_org_name'] or "Organization"
            sender_type = "organization"
        elif notification['sender_user_id'] and not notification['is_anonymous']:
            sender_name = "Volunteer"
            sender_type = "volunteer"
        
        # Create email content
        subject = f"New message in \"{notification['event_title']}\" chat"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #00AFCE 0%, #0077B6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Taylor Connect Hub</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">New Chat Message</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">New Message in Event Chat</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00AFCE;">
                    <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">{notification['event_title']}</h3>
                    <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                        {notification['event_description'][:100]}{'...' if len(notification['event_description']) > 100 else ''}
                    </p>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #0056b3; margin: 0 0 10px 0; font-weight: bold;">
                        <strong>From:</strong> {sender_name}
                    </p>
                    <p style="color: #333; margin: 0; font-style: italic; line-height: 1.6;">
                        "{notification['message']}"
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:8080/opportunities" 
                       style="background: #00AFCE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        View Event Chat →
                    </a>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #666; margin: 0; font-size: 14px;">
                        <strong>Event Details:</strong><br>
                        • Organization: {notification['org_name'] or 'Community Event'}<br>
                        • You can manage your notification preferences in your account settings.
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>© 2024 Taylor Connect Hub. All rights reserved.</p>
                <p>This email was sent to {notification['user_email']}</p>
            </div>
        </div>
        """
        
        # Send email
        params = {
            "from": "Taylor Connect <noreply@ellmangroup.org>",
            "to": [notification['user_email']],
            "subject": subject,
            "html": html_content
        }
        
        print(f"Sending chat notification to: {notification['user_email']}")
        email_response = resend.Emails.send(params)
        print("Email sent successfully:", email_response)
        return True
        
    except Exception as e:
        print("Error sending chat notification email:", e)
        return False

def mark_notification_sent(notification_id: str) -> bool:
    """Mark notification as sent"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE notifications 
            SET sent_at = %s, email_sent = true
            WHERE id = %s
        """, (datetime.now(timezone.utc), notification_id))
        
        connection.commit()
        print(f"Marked notification {notification_id} as sent")
        return True
        
    except Exception as e:
        print(f"Database error marking notification sent: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def process_chat_notifications():
    """Process all pending chat notifications"""
    print("Starting chat notification processing...")
    
    # Get pending notifications
    notifications = get_pending_notifications()
    print(f"Found {len(notifications)} pending notifications")
    
    sent_count = 0
    error_count = 0
    
    for notification in notifications:
        try:
            # Check if we should send this notification
            if should_send_notification(
                notification['user_id'], 
                notification['event_id'], 
                notification['chat_message_id']
            ):
                # Send the email
                if send_chat_notification_email(notification):
                    # Mark as sent
                    if mark_notification_sent(notification['id']):
                        sent_count += 1
                        print(f"Successfully sent notification to {notification['user_email']}")
                    else:
                        error_count += 1
                        print(f"Failed to mark notification as sent for {notification['user_email']}")
                else:
                    error_count += 1
                    print(f"Failed to send email to {notification['user_email']}")
            else:
                print(f"Skipping notification for {notification['user_email']} (preferences or recent activity)")
                # Mark as sent to avoid reprocessing
                mark_notification_sent(notification['id'])
                
        except Exception as e:
            error_count += 1
            print(f"Error processing notification: {e}")
            continue
    
    print(f"Processing complete: {sent_count} sent, {error_count} errors")
    return sent_count, error_count

if __name__ == "__main__":
    # Process all pending notifications
    sent, errors = process_chat_notifications()
    print(f"Final result: {sent} notifications sent, {errors} errors")
    
    # Exit with error code if there were errors
    if errors > 0:
        sys.exit(1) 
import resend
import os
import sys
import psycopg2
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from resend import Resend
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chat_notifications.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Initialize Resend with latest API
try:
    resend_api_key = os.getenv('RESEND_API_KEY', "re_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92")
    resend_client = Resend(api_key=resend_api_key)
    logger.info("Resend client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Resend client: {e}")
    sys.exit(1)

# Database connection
DB_HOST = os.getenv('DB_HOST', 'aws-0-us-east-2.pooler.supabase.com')
DB_PORT = os.getenv('DB_PORT', '6543')
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = os.getenv('DB_USER', 'postgres.gzzbjifmrwvqbkwbyvhm')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'Idonotunderstandwhatido!')

def get_db_connection():
    """Get database connection with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            connection = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                connect_timeout=10
            )
            logger.info("Database connection established successfully")
            return connection
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                logger.error("Failed to establish database connection after all retries")
                return None
            time.sleep(2 ** attempt)  # Exponential backoff

def get_pending_notifications():
    """Get pending notifications that need to be sent using the new function"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
        
        # Use the new optimized function
        cursor.execute("SELECT * FROM get_pending_notifications()")
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        notifications = []
        for row in cursor.fetchall():
            notification = dict(zip(columns, row))
            notifications.append(notification)
        
        logger.info(f"Retrieved {len(notifications)} pending notifications")
        return notifications
        
    except Exception as e:
        logger.error(f"Database error getting pending notifications: {e}")
        return []
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
        cursor.execute("""
            SELECT email_frequency, chat_notifications
            FROM notification_preferences
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        if result:
            email_frequency, chat_notifications = result
        else:
            # Default preferences
            email_frequency, chat_notifications = 'immediate', True
        
        # If chat notifications are disabled, don't send
        if not chat_notifications:
            logger.info(f"Chat notifications disabled for user {user_id}")
            return False
        
        # Check if we've already sent a notification for this message to this user
        cursor.execute("""
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = %s AND chat_message_id = %s AND email_sent = true
        """, (user_id, message_id))
        
        if cursor.fetchone()[0] > 0:
            logger.info(f"Notification already sent for message {message_id} to user {user_id}")
            return False
        
        # For immediate notifications, always send
        if email_frequency == 'immediate':
            return True
        
        # For daily/weekly, check if we've sent one recently
        if email_frequency in ['daily', 'weekly']:
            # Check if we've sent a notification for this event in the last 24 hours
            cursor.execute("""
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = %s AND event_id = %s AND email_sent = true 
                AND sent_at > %s
            """, (user_id, event_id, datetime.now(timezone.utc) - timedelta(hours=24)))
            
            if cursor.fetchone()[0] > 0:
                logger.info(f"Recent notification already sent for event {event_id} to user {user_id}")
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"Database error checking notification: {e}")
        return False
    finally:
        connection.close()

def send_chat_notification_email(notification: Dict) -> bool:
    """Send chat notification email using latest Resend API"""
    try:
        # Determine sender information
        sender_name = notification.get('sender_name', 'Anonymous')
        sender_type = notification.get('sender_type', 'anonymous')
        event_title = notification.get('event_title', 'Event')
        event_description = notification.get('event_description', '')
        organization_name = notification.get('organization_name', 'Community Event')
        
        # Create email content with improved design
        subject = f"New message in \"{event_title}\" chat"
        
        html_content = f"""
        <p>acme - New Chat Message</p>
        <p>New message in "{event_title}" event chat</p>
        <p><strong>From:</strong> {sender_name}</p>
        <p><strong>Message:</strong> "{notification.get('message', '')}"</p>
        <p><strong>Event:</strong> {event_title} ({organization_name})</p>
        <p>Visit acme to view the full conversation and respond.</p>
        """
        
        # Send email using latest Resend API
        email_response = resend_client.emails.send({
            "from": "acme <noreply@uplandmainstreet.org>",
            "to": [notification['user_email']],
            "subject": subject,
            "html": html_content
        })
        
        logger.info(f"Email sent successfully to {notification['user_email']}: {email_response.id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending chat notification email to {notification.get('user_email', 'unknown')}: {e}")
        return False

def mark_notification_sent(notification_id: str) -> bool:
    """Mark notification as sent using the new function"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Use the new function
        cursor.execute("SELECT mark_notification_sent(%s)", (notification_id,))
        result = cursor.fetchone()
        
        if result and result[0]:
            logger.info(f"Marked notification {notification_id} as sent")
            connection.commit()
            return True
        else:
            logger.warning(f"Failed to mark notification {notification_id} as sent")
            return False
        
    except Exception as e:
        logger.error(f"Database error marking notification sent: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()

def process_chat_notifications():
    """Process all pending chat notifications with comprehensive error handling"""
    logger.info("Starting chat notification processing...")
    
    start_time = datetime.now()
    
    # Get pending notifications
    notifications = get_pending_notifications()
    logger.info(f"Found {len(notifications)} pending notifications")
    
    if not notifications:
        logger.info("No pending notifications to process")
        return 0, 0
    
    sent_count = 0
    error_count = 0
    skipped_count = 0
    
    for i, notification in enumerate(notifications, 1):
        try:
            logger.info(f"Processing notification {i}/{len(notifications)}: {notification.get('id', 'unknown')}")
            
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
                        logger.info(f"Successfully processed notification {i}: {notification.get('user_email', 'unknown')}")
                    else:
                        error_count += 1
                        logger.error(f"Failed to mark notification {i} as sent: {notification.get('user_email', 'unknown')}")
                else:
                    error_count += 1
                    logger.error(f"Failed to send email for notification {i}: {notification.get('user_email', 'unknown')}")
            else:
                skipped_count += 1
                logger.info(f"Skipped notification {i}: {notification.get('user_email', 'unknown')} (preferences or recent activity)")
                # Mark as sent to avoid reprocessing
                mark_notification_sent(notification['id'])
                
        except Exception as e:
            error_count += 1
            logger.error(f"Error processing notification {i}: {e}")
            continue
    
    processing_time = datetime.now() - start_time
    logger.info(f"Processing complete in {processing_time.total_seconds():.2f}s: {sent_count} sent, {skipped_count} skipped, {error_count} errors")
    
    return sent_count, error_count

def get_notification_stats():
    """Get notification processing statistics"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM get_notification_stats()")
        
        columns = [desc[0] for desc in cursor.description]
        result = cursor.fetchone()
        
        if result:
            stats = dict(zip(columns, result))
            logger.info(f"Notification stats: {stats}")
            return stats
        return None
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {e}")
        return None
    finally:
        connection.close()

if __name__ == "__main__":
    try:
        # Get stats before processing
        stats_before = get_notification_stats()
        if stats_before:
            logger.info(f"Stats before processing: {stats_before}")
        
        # Process all pending notifications
        sent, errors = process_chat_notifications()
        
        # Get stats after processing
        stats_after = get_notification_stats()
        if stats_after:
            logger.info(f"Stats after processing: {stats_after}")
        
        logger.info(f"Final result: {sent} notifications sent, {errors} errors")
        
        # Exit with error code if there were errors
        if errors > 0:
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Critical error in main execution: {e}")
        sys.exit(1) 
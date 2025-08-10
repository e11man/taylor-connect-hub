# Chat Notification System - API Reference

## Database Functions

### create\_chat\_notifications()

**Purpose**: Automatically creates notification records when new chat messages are posted.

**Trigger**: Executed automatically via `on_chat_message_created` trigger

**Parameters**: None (uses NEW record from trigger)

**Logic**:

1. Identifies event participants and organization members
2. Checks user notification preferences
3. Respects scheduling preferences (immediate vs daily digest)
4. Creates notification records with status 'pending'

**Example Usage**:

```sql
-- Triggered automatically when inserting chat messages
INSERT INTO chat_messages (event_id, user_id, message, message_type)
VALUES (uuid_value, user_uuid, 'Hello everyone!', 'text');
```

**Returns**: TRIGGER

***

### get\_pending\_notifications()

**Purpose**: Retrieves all pending notifications with complete context for email processing.

**Parameters**: None

**Returns**: TABLE with columns:

* `notification_id` (UUID): Unique notification identifier

* `user_id` (UUID): Recipient user ID

* `user_email` (TEXT): Recipient email address

* `user_name` (TEXT): Recipient display name

* `event_id` (UUID): Related event ID

* `event_title` (TEXT): Event title

* `event_description` (TEXT): Event description

* `message_id` (UUID): Chat message ID

* `message_content` (TEXT): Chat message content

* `sender_name` (TEXT): Message sender name

* `created_at` (TIMESTAMPTZ): Notification creation time

**Example Usage**:

```sql
SELECT * FROM get_pending_notifications();
```

**Sample Response**:

```sql
notification_id | user_email        | event_title      | message_content
----------------|-------------------|------------------|----------------
uuid-123        | user@example.com  | Beach Cleanup    | Great initiative!
uuid-456        | admin@example.com | Food Drive       | Count me in!
```

***

### mark\_notification\_sent(notification\_id UUID)

**Purpose**: Updates notification status to 'sent' after successful email delivery.

**Parameters**:

* `notification_id` (UUID): The notification to mark as sent

**Returns**: VOID

**Example Usage**:

```sql
SELECT mark_notification_sent('550e8400-e29b-41d4-a716-446655440000');
```

***

### get\_notification\_stats()

**Purpose**: Provides comprehensive statistics for monitoring notification system performance.

**Parameters**: None

**Returns**: TABLE with columns:

* `total_notifications` (BIGINT): Total notifications in system

* `pending_count` (BIGINT): Currently pending notifications

* `sent_count` (BIGINT): Successfully sent notifications

* `failed_count` (BIGINT): Failed notifications

* `success_rate` (NUMERIC): Percentage of successful deliveries

* `avg_processing_time` (INTERVAL): Average time from creation to delivery

**Example Usage**:

```sql
SELECT * FROM get_notification_stats();
```

**Sample Response**:

```sql
total_notifications | pending_count | sent_count | failed_count | success_rate | avg_processing_time
-------------------|---------------|------------|--------------|--------------|-------------------
1250               | 15            | 1200       | 35           | 97.20        | 00:03:45
```

## Edge Functions

### send-chat-notifications

**Endpoint**: `POST /functions/v1/send-chat-notifications`

**Purpose**: Processes pending notifications and sends emails via Resend API.

**Authentication**: Requires service role key or valid JWT

**Request Headers**:

```http
Content-Type: application/json
Authorization: Bearer <service_role_key>
```

**Request Body**:

```json
{
  "batchSize": 50,
  "maxRetries": 3,
  "testMode": false
}
```

**Request Parameters**:

* `batchSize` (optional, number): Number of notifications to process (default: 50, max: 100)

* `maxRetries` (optional, number): Retry attempts for failed emails (default: 3, max: 5)

* `testMode` (optional, boolean): If true, logs actions without sending emails (default: false)

**Response**:

```json
{
  "success": true,
  "processed": 25,
  "sent": 23,
  "failed": 2,
  "errors": [
    {
      "notificationId": "uuid-123",
      "error": "Invalid email address",
      "retryCount": 3
    }
  ],
  "processingTime": 4.2,
  "rateLimitRemaining": 875
}
```

**Error Responses**:

```json
// 400 Bad Request
{
  "error": "Invalid batch size. Must be between 1 and 100.",
  "code": "INVALID_BATCH_SIZE"
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded. Try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "Failed to process notifications",
  "code": "PROCESSING_ERROR",
  "details": "Database connection failed"
}
```

**Example Usage**:

```bash
curl -X POST \
  https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-chat-notifications \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 25,
    "testMode": false
  }'
```

***

### process-notifications-cron

**Endpoint**: `POST /functions/v1/process-notifications-cron`

**Purpose**: Cron job endpoint that orchestrates the notification processing workflow.

**Authentication**: Internal service calls only (service role key)

**Request Headers**:

```http
Content-Type: application/json
Authorization: Bearer <service_role_key>
```

**Request Body**:

```json
{}
```

**Response**:

```json
{
  "success": true,
  "cronJobId": "process-chat-notifications",
  "executionTime": "2024-01-15T10:30:00Z",
  "batchesProcessed": 3,
  "totalNotifications": 127,
  "summary": {
    "sent": 120,
    "failed": 7,
    "skipped": 0
  },
  "nextExecution": "2024-01-15T10:35:00Z"
}
```

**Error Responses**:

```json
// 503 Service Unavailable
{
  "error": "Notification processing temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "retryAfter": 300
}
```

## Database Schema

### notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    email_sent_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:

```sql
CREATE INDEX idx_notifications_status_created ON notifications(status, created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_event_id ON notifications(event_id);
CREATE INDEX idx_notifications_message_id ON notifications(message_id);
```

**Row Level Security**:

```sql
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all notifications
GRANT ALL ON notifications TO service_role;
```

### notification\_preferences Table

```sql
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_notifications BOOLEAN DEFAULT true,
    email_frequency VARCHAR(20) DEFAULT 'immediate' 
        CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Email Templates

### Chat Notification Email

**Subject**: `New message in {{event_title}}`

**HTML Template**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message - Taylor Connect</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background-color: #0A2540; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .message-box { background-color: #f8f9fa; border-left: 4px solid #E8A87C; padding: 15px; margin: 20px 0; }
        .button { background-color: #E8A87C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { background-color: #525f7f; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Taylor Connect</h1>
            <p>New message in your event</p>
        </div>
        
        <div class="content">
            <h2>{{event_title}}</h2>
            <p>Hi {{user_name}},</p>
            <p>{{sender_name}} posted a new message in <strong>{{event_title}}</strong>:</p>
            
            <div class="message-box">
                <strong>{{sender_name}}:</strong><br>
                {{message_content}}
            </div>
            
            <p>Join the conversation and stay connected with your community!</p>
            
            <a href="{{event_url}}" class="button">View Event & Reply</a>
        </div>
        
        <div class="footer">
            <p>Taylor Connect - Building stronger communities</p>
            <p><a href="{{unsubscribe_url}}" style="color: #E8A87C;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #E8A87C;">Manage Preferences</a></p>
        </div>
    </div>
</body>
</html>
```

**Text Template**:

```text
Taylor Connect - New Message

Hi {{user_name}},

{{sender_name}} posted a new message in {{event_title}}:

"{{message_content}}"

View the event and reply: {{event_url}}

---
Taylor Connect - Building stronger communities
Unsubscribe: {{unsubscribe_url}}
Manage Preferences: {{preferences_url}}
```

## Integration Examples

### Frontend Integration

```typescript
// chatNotificationService.ts
export class ChatNotificationService {
  // No manual triggering needed - database handles automatically
  
  static async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    return { data, error };
  }
  
  static async updatePreferences(userId: string, preferences: NotificationPreferences) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...preferences })
      .select();
      
    return { data, error };
  }
  
  static async getNotificationHistory(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        status,
        created_at,
        email_sent_at,
        events(title),
        chat_messages(message)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    return { data, error };
  }
}
```

### Backend Integration

```typescript
// Manual processing (if needed)
export async function processNotificationsManually() {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/send-chat-notifications`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        batchSize: 100,
        testMode: false
      })
    }
  );
  
  return await response.json();
}
```

## Rate Limits & Quotas

### Resend API Limits

* **Free Tier**: 100 emails/day, 10 emails/second

* **Pro Tier**: 50,000 emails/month, 100 emails/second

* **Business Tier**: 100,000 emails/month, 100 emails/second

### Supabase Limits

* **Edge Functions**: 500,000 invocations/month (free), 2M invocations/month (pro)

* **Database**: 500MB (free), 8GB (pro)

* **Cron Jobs**: 100 jobs (free), 1000 jobs (pro)

### System Configuration

```typescript
const RATE_LIMITS = {
  emailsPerSecond: 10,
  batchSize: 50,
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  maxProcessingTime: 240000 // 4 minutes
};
```

***

\*\*API Version

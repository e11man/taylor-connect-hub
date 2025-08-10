# Chat Notification System - Deployment Guide

## Quick Start Deployment

### Prerequisites
- Supabase CLI installed and configured
- Resend API account with production API key
- Access to Supabase project: `gzzbjifmrwvqbkwbyvhm`

### 1. Environment Setup

```bash
# Set Supabase project reference
export SUPABASE_PROJECT_REF=gzzbjifmrwvqbkwbyvhm

# Set production secrets
supabase secrets set RESEND_API_KEY=re_your_production_key --project-ref $SUPABASE_PROJECT_REF

# Verify secrets
supabase secrets list --project-ref $SUPABASE_PROJECT_REF
```

### 2. Deploy Edge Functions

```bash
# Deploy all notification-related Edge Functions
supabase functions deploy send-chat-notifications --no-verify-jwt --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy process-notifications-cron --no-verify-jwt --project-ref $SUPABASE_PROJECT_REF

# Verify deployments
supabase functions list --project-ref $SUPABASE_PROJECT_REF
```

### 3. Database Setup

```sql
-- Apply the complete migration (if not already applied)
-- This includes all triggers, functions, and indexes
\i supabase/migrations/20241201000000_fix_chat_notifications_complete.sql

-- Verify trigger is active
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_chat_message_created';
```

### 4. Configure Cron Job

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule notification processing every 5 minutes
SELECT cron.schedule(
    'process-chat-notifications',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/process-notifications-cron',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- Verify cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'process-chat-notifications';
```

## Configuration Files

### Edge Function: send-chat-notifications

**Location**: `supabase/functions/send-chat-notifications/index.ts`

```typescript
// Production configuration
const BATCH_SIZE = 50; // Process 50 notifications per batch
const MAX_RETRIES = 3; // Retry failed emails 3 times
const RATE_LIMIT_DELAY = 100; // 100ms between emails (10 emails/second)
const RESEND_API_URL = 'https://api.resend.com/emails';

// Email template configuration
const EMAIL_CONFIG = {
  from: 'Taylor Connect <notifications@taylorconnect.org>',
  replyTo: 'support@taylorconnect.org',
  subject: 'New message in {{event_title}}',
  brandColors: {
    primary: '#0A2540',
    secondary: '#525f7f',
    accent: '#E8A87C'
  }
};
```

### Edge Function: process-notifications-cron

**Location**: `supabase/functions/process-notifications-cron/index.ts`

```typescript
// Cron job configuration
const PROCESSING_CONFIG = {
  batchSize: 100, // Fetch 100 pending notifications
  maxProcessingTime: 240000, // 4 minutes max processing time
  errorThreshold: 0.1, // Stop if >10% of emails fail
  logLevel: 'info' // Production logging level
};
```

## Testing Deployment

### 1. Test Database Triggers

```sql
-- Insert a test chat message to trigger notifications
INSERT INTO chat_messages (event_id, user_id, message, message_type)
VALUES (
    (SELECT id FROM events LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'Test message for notification system',
    'text'
);

-- Check if notifications were created
SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';
```

### 2. Test Edge Function Manually

```bash
# Test send-chat-notifications function
curl -X POST \
  https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-chat-notifications \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test cron function
curl -X POST \
  https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/process-notifications-cron \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Verify Email Delivery

```sql
-- Check notification processing status
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(updated_at) as latest
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

## Monitoring Setup

### 1. Create Monitoring Views

```sql
-- Real-time notification dashboard
CREATE OR REPLACE VIEW notification_dashboard AS
SELECT 
    'Last 24 Hours' as period,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    ROUND(COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as success_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Last 7 Days' as period,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    ROUND(COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as success_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days';
```

### 2. Set Up Alerts

```sql
-- Function to check system health
CREATE OR REPLACE FUNCTION check_notification_health()
RETURNS TABLE(
    alert_type TEXT,
    alert_message TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for pending notifications older than 30 minutes
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE status = 'pending' 
        AND created_at < NOW() - INTERVAL '30 minutes'
    ) THEN
        RETURN QUERY SELECT 
            'PROCESSING_DELAY'::TEXT,
            'Notifications pending for more than 30 minutes'::TEXT,
            'HIGH'::TEXT;
    END IF;
    
    -- Check error rate in last hour
    IF (
        SELECT COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)
        FROM notifications 
        WHERE created_at > NOW() - INTERVAL '1 hour'
    ) > 5 THEN
        RETURN QUERY SELECT 
            'HIGH_ERROR_RATE'::TEXT,
            'Error rate exceeds 5% in the last hour'::TEXT,
            'MEDIUM'::TEXT;
    END IF;
    
    -- Check if cron job is running
    IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE status = 'sent' 
        AND updated_at > NOW() - INTERVAL '10 minutes'
    ) AND EXISTS (
        SELECT 1 FROM notifications 
        WHERE status = 'pending'
    ) THEN
        RETURN QUERY SELECT 
            'CRON_NOT_RUNNING'::TEXT,
            'No notifications processed in last 10 minutes'::TEXT,
            'HIGH'::TEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
```

## Rollback Procedures

### Emergency Rollback

```bash
# 1. Disable cron job
psql -h db.gzzbjifmrwvqbkwbyvhm.supabase.co -U postgres -c \
"SELECT cron.unschedule('process-chat-notifications');"

# 2. Remove Edge Functions
supabase functions delete send-chat-notifications --project-ref $SUPABASE_PROJECT_REF
supabase functions delete process-notifications-cron --project-ref $SUPABASE_PROJECT_REF

# 3. Disable database trigger (if needed)
psql -h db.gzzbjifmrwvqbkwbyvhm.supabase.co -U postgres -c \
"DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;"
```

### Gradual Rollback

```sql
-- 1. Stop processing new notifications
UPDATE notifications SET status = 'paused' WHERE status = 'pending';

-- 2. Monitor existing processing
SELECT COUNT(*) FROM notifications WHERE status = 'processing';

-- 3. Re-enable when ready
UPDATE notifications SET status = 'pending' WHERE status = 'paused';
```

## Performance Optimization

### Database Tuning

```sql
-- Optimize notification queries
CREATE INDEX CONCURRENTLY idx_notifications_status_created_at 
ON notifications(status, created_at) 
WHERE status IN ('pending', 'processing');

-- Partition large notification table (if needed)
CREATE TABLE notifications_2024_01 PARTITION OF notifications
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Edge Function Optimization

```typescript
// Connection pooling for database
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive'
    }
  }
});

// Batch email sending
const sendEmailBatch = async (notifications: Notification[]) => {
  const emailPromises = notifications.map(notification => 
    sendEmail(notification).catch(error => ({ error, notification }))
  );
  
  return await Promise.allSettled(emailPromises);
};
```

---

**Deployment Checklist**:
- [ ] Environment variables configured
- [ ] Edge Functions deployed
- [ ] Database migration applied
- [ ] Cron job scheduled
- [ ] Test notifications sent
- [ ] Monitoring views created
- [ ] Alert functions configured
- [ ] Performance indexes added
- [ ] Rollback procedures documented

**Support Contact**: development-team@taylorconnect.org
**Emergency Contact**: +1-XXX-XXX-XXXX
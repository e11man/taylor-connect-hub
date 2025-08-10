# 🚀 Production Chat Notification System

## Overview
A fully automated, production-ready chat notification system built with Supabase Edge Functions and Resend API. This system automatically sends email notifications when new chat messages are posted in events, with intelligent scheduling and user preference management.

## 🏗️ Architecture

### Core Components
1. **Database Triggers** - Automatically create notifications when chat messages are posted
2. **Edge Functions** - Process and send email notifications via Resend API
3. **Cron Jobs** - Automated processing every 5 minutes
4. **Monitoring** - Real-time stats and logging

### Edge Functions
- `send-chat-notifications` - Main notification processor
- `process-notifications-cron` - Automated cron job for processing
- `send-admin-approval` - Admin approval notifications
- `send-email` - General email service
- `send-organization-otp` - Organization verification
- `send-signup-confirmation` - User signup confirmations

## 🚀 Deployment

### Quick Deploy
```bash
# Deploy all Edge Functions
./supabase/functions/deploy_edge_functions.sh
```

### Manual Setup
1. **Set Production Environment Variables:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_production_key --project-ref gzzbjifmrwvqbkwbyvhm
   ```

2. **Enable Cron Job:**
   ```bash
   supabase functions schedule process-notifications-cron --cron '*/5 * * * *'
   ```

3. **Verify Deployment:**
   ```bash
   supabase functions list --project-ref gzzbjifmrwvqbkwbyvhm
   ```

## 📊 Monitoring & Logs

### View Function Logs
```bash
# Chat notification logs
supabase functions logs send-chat-notifications --project-ref gzzbjifmrwvqbkwbyvhm

# Cron job logs
supabase functions logs process-notifications-cron --project-ref gzzbjifmrwvqbkwbyvhm
```

### Database Monitoring
```sql
-- Check notification status
SELECT * FROM notification_status;

-- Get notification statistics
SELECT * FROM get_notification_stats();

-- View pending notifications
SELECT * FROM get_pending_notifications();
```

## 🔧 Configuration

### Environment Variables
- `RESEND_API_KEY` - Production Resend API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

### Notification Preferences
Users can control their notification preferences through the `notification_preferences` table:
- `chat_notifications` - Enable/disable chat notifications
- `email_notifications` - Enable/disable email notifications
- `notification_schedule` - Immediate, daily, or weekly digest

## 📧 Email Templates

The system uses professional HTML email templates with:
- **Responsive design** for all devices
- **Brand colors** (#0A2540, #525f7f, #E8A87C)
- **Clear call-to-action** buttons
- **Event context** and sender information
- **Unsubscribe functionality**

## 🔄 How It Works

1. **Message Posted** - User posts a chat message in an event
2. **Trigger Fired** - Database trigger `on_chat_message_created` executes
3. **Notifications Created** - `create_chat_notifications()` function creates notifications for:
   - Event participants (based on their preferences)
   - Organization members (if applicable)
4. **Cron Processing** - Every 5 minutes, `process-notifications-cron` runs
5. **Email Sending** - `send-chat-notifications` processes pending notifications
6. **Status Update** - Notifications marked as sent in database

## 🛠️ Troubleshooting

### Common Issues

**No notifications being sent:**
```sql
-- Check if triggers are enabled
SELECT * FROM pg_trigger WHERE tgname = 'on_chat_message_created';

-- Check notification preferences
SELECT * FROM notification_preferences WHERE user_id = 'user-id';
```

**Email delivery issues:**
- Verify Resend API key is set correctly
- Check Resend dashboard for delivery status
- Review function logs for errors

**Cron job not running:**
```bash
# Check cron job status
supabase functions list --project-ref gzzbjifmrwvqbkwbyvhm

# Manually trigger cron job
curl -X POST https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/process-notifications-cron
```

## 📈 Performance

### Optimization Features
- **Batch processing** - Process multiple notifications efficiently
- **Rate limiting** - Respect Resend API limits
- **Retry logic** - Exponential backoff for failed sends
- **Database indexes** - Optimized queries for performance
- **Cleanup procedures** - Automatic cleanup of old notifications

### Scaling Considerations
- Cron frequency can be adjusted based on volume
- Batch size can be increased for high-volume scenarios
- Additional Edge Function instances auto-scale with demand

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Service role key** used only in secure Edge Functions
- **CORS headers** properly configured
- **Input validation** on all function parameters
- **Rate limiting** to prevent abuse

## 📋 Function URLs

- **send-chat-notifications**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-chat-notifications`
- **process-notifications-cron**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/process-notifications-cron`
- **send-admin-approval**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-admin-approval`
- **send-email**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-email`
- **send-organization-otp**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-organization-otp`
- **send-signup-confirmation**: `https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/send-signup-confirmation`

## 🎯 Success Criteria

✅ **Automated Processing** - No manual intervention required  
✅ **Reliable Delivery** - Professional emails via Resend API  
✅ **User Preferences** - Respects individual notification settings  
✅ **Production Ready** - Error handling, logging, and monitoring  
✅ **Scalable Architecture** - Handles high message volumes  
✅ **Professional Design** - Branded email templates  
✅ **Real-time Processing** - Notifications sent within 5 minutes  

---

**Your production-ready chat notification system is now fully operational! 🎉**
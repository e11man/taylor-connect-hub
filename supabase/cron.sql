-- Cron job configuration for automated chat notification processing
-- This will run the process-notifications-cron Edge Function every 5 minutes

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to process chat notifications every 5 minutes
SELECT cron.schedule(
  'process-chat-notifications',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://gzzbjifmrwvqbkwbyvhm.supabase.co/functions/v1/process-notifications-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'source', 'cron_job',
        'timestamp', now()
      )
    ) as request_id;
  $$
);

-- Check if the cron job was created successfully
SELECT * FROM cron.job WHERE jobname = 'process-chat-notifications';

-- To remove the cron job (for maintenance), uncomment the line below:
-- SELECT cron.unschedule('process-chat-notifications');
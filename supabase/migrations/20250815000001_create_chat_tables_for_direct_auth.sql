-- Create chat tables for direct authentication
-- This migration creates chat_messages, notification_preferences, and notifications tables
-- that work with direct authentication using profiles table instead of auth.users

-- 1. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS on chat_messages for direct authentication
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  chat_notifications BOOLEAN NOT NULL DEFAULT true,
  event_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS on notification_preferences for direct authentication
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

-- 3. Create notifications table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  chat_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('chat_message', 'event_update')),
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS on notifications for direct authentication
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- 4. Add trigger for timestamp updates on chat_messages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Function to handle new chat message notifications (simplified for direct auth)
CREATE OR REPLACE FUNCTION public.create_chat_notifications()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Create notifications for all users signed up for the event (except the sender)
  INSERT INTO public.notifications (user_id, event_id, chat_message_id, notification_type, scheduled_for)
  SELECT 
    ue.user_id,
    NEW.event_id,
    NEW.id,
    'chat_message',
    CASE 
      WHEN np.email_frequency = 'immediate' THEN now()
      WHEN np.email_frequency = 'daily' THEN date_trunc('day', now()) + interval '1 day' + interval '9 hours'
      WHEN np.email_frequency = 'weekly' THEN date_trunc('week', now()) + interval '1 week' + interval '9 hours'
      ELSE NULL
    END
  FROM public.user_events ue
  LEFT JOIN public.notification_preferences np ON np.user_id = ue.user_id
  WHERE ue.event_id = NEW.event_id 
    AND ue.user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000')
    AND (np.chat_notifications = true OR np.chat_notifications IS NULL)
    AND (np.email_frequency != 'never' OR np.email_frequency IS NULL);

  -- Also notify the organization that created the event (if they're not the sender)
  INSERT INTO public.notifications (user_id, event_id, chat_message_id, notification_type, scheduled_for)
  SELECT 
    o.user_id,
    NEW.event_id,
    NEW.id,
    'chat_message',
    CASE 
      WHEN np.email_frequency = 'immediate' THEN now()
      WHEN np.email_frequency = 'daily' THEN date_trunc('day', now()) + interval '1 day' + interval '9 hours'
      WHEN np.email_frequency = 'weekly' THEN date_trunc('week', now()) + interval '1 week' + interval '9 hours'
      ELSE NULL
    END
  FROM public.events e
  JOIN public.organizations o ON o.id = e.organization_id
  LEFT JOIN public.notification_preferences np ON np.user_id = o.user_id
  WHERE e.id = NEW.event_id 
    AND o.id != COALESCE(NEW.organization_id, '00000000-0000-0000-0000-000000000000')
    AND (np.chat_notifications = true OR np.chat_notifications IS NULL)
    AND (np.email_frequency != 'never' OR np.email_frequency IS NULL);

  RETURN NEW;
END;
$$;

-- 6. Create trigger for new chat messages
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notifications();

-- 7. Enable realtime for chat messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
-- Note: ALTER publication supabase_realtime ADD TABLE public.chat_messages; 
-- This command may need to be run manually in Supabase dashboard if it fails

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_event_id ON public.chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);
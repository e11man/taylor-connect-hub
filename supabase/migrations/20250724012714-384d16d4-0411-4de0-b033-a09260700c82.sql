-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Anyone can view chat messages for events" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())) OR
  (user_id IS NULL AND organization_id IS NULL AND is_anonymous = true)
);

CREATE POLICY "Users can update their own messages" 
ON public.chat_messages 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can delete their own messages" 
ON public.chat_messages 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  chat_notifications BOOLEAN NOT NULL DEFAULT true,
  event_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create notifications table for tracking sent notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  chat_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('chat_message', 'event_update')),
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add trigger for timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new chat message notifications
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
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

-- Create trigger for new chat messages
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_chat_message();

-- Enable realtime for chat messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.chat_messages;
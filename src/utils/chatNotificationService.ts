import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  event_id: string;
  user_id?: string;
  organization_id?: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
}

interface NotificationPreferences {
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  chat_notifications: boolean;
  event_updates: boolean;
}

export const sendChatMessage = async (
  eventId: string,
  message: string,
  isAnonymous: boolean = false,
  userId?: string,
  organizationId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Insert the chat message
    const { data: chatMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        event_id: eventId,
        user_id: userId,
        organization_id: organizationId,
        message,
        is_anonymous: isAnonymous
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting chat message:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, messageId: chatMessage.id };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

// Notification processing is now handled automatically via Supabase Edge Functions
// Database triggers create notifications when chat messages are posted
// A cron function processes notifications every 5 minutes

export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_notification_preferences', { p_user_id: userId });

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    if (data && data.length > 0) {
      return {
        email_frequency: data[0].email_frequency,
        chat_notifications: data[0].chat_notifications,
        event_updates: data[0].event_updates
      };
    }

    // Return default preferences if none found
    return {
      email_frequency: 'immediate',
      chat_notifications: true,
      event_updates: true
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
};

export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .rpc('upsert_notification_preferences', {
        p_user_id: userId,
        p_email_frequency: preferences.email_frequency || 'immediate',
        p_chat_notifications: preferences.chat_notifications !== undefined ? preferences.chat_notifications : true,
        p_event_updates: preferences.event_updates !== undefined ? preferences.event_updates : true,
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
};

export const getEventChatMessages = async (eventId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        event_id,
        user_id,
        organization_id,
        message,
        is_anonymous,
        created_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('sent_at', null);

    if (error) {
      console.error('Error fetching unread notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

export const markNotificationsAsRead = async (userId: string, eventId?: string): Promise<void> => {
  try {
    let query = supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('sent_at', null);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error marking notifications as read:', error);
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

// Manual notification triggering is no longer needed
// The system uses automatic processing via Supabase Edge Functions
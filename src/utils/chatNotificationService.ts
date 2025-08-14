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

    // Send notifications immediately after posting the message
    await sendChatNotifications(chatMessage, eventId);

    return { success: true, messageId: chatMessage.id };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

// Function to send chat notifications using direct email service
const sendChatNotifications = async (chatMessage: any, eventId: string): Promise<void> => {
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        organization_id,
        organizations (
          id,
          name,
          user_id
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event details:', eventError);
      return;
    }

    // Get sender information
    let senderName = 'Anonymous';
    let senderType = 'anonymous';

    if (chatMessage.user_id) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', chatMessage.user_id)
        .single();
      
      if (userProfile) {
        senderName = userProfile.email;
        senderType = 'user';
      }
    } else if (chatMessage.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', chatMessage.organization_id)
        .single();
      
      if (orgData) {
        senderName = orgData.name;
        senderType = 'organization';
      }
    }

    // Get users signed up for the event (excluding sender)
    let usersQuery = supabase
      .from('user_events')
      .select('user_id')
      .eq('event_id', eventId);

    // Exclude the sender if it's a user
    if (chatMessage.user_id) {
      usersQuery = usersQuery.neq('user_id', chatMessage.user_id);
    }

    const { data: userEvents, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching signed up users:', usersError);
      return;
    }

    // Get profile details for each user
    const signedUpUsers = [];
    if (userEvents) {
      for (const userEvent of userEvents) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', userEvent.user_id)
          .single();
        
        if (profile) {
          signedUpUsers.push({ profiles: profile });
        }
      }
    }

    // Get email service URL (same pattern as verification emails)
    const getEmailServiceUrl = () => {
      if (typeof window !== 'undefined') {
        return window.location.origin.includes('localhost') 
          ? 'http://localhost:3000' 
          : window.location.origin;
      }
      return 'https://taylor-connect-hub.vercel.app';
    };

    const emailServiceUrl = getEmailServiceUrl();

    // Send notifications to signed up users
    const emailPromises = [];

    if (signedUpUsers) {
      for (const userEvent of signedUpUsers) {
        const user = userEvent.profiles;
        if (!user?.email) continue;

        // Check user's notification preferences
        const preferences = await getUserNotificationPreferences(user.id);
        
        // Skip if user has disabled chat notifications or set frequency to never
        if (!preferences?.chat_notifications || preferences.email_frequency === 'never') {
          continue;
        }

        // For now, send immediate notifications (can be enhanced later for daily/weekly)
        if (preferences.email_frequency === 'immediate') {
          emailPromises.push(
            fetch(`${emailServiceUrl}/api/send-chat-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail: user.email,
                eventTitle: event.title,
                message: chatMessage.message,
                senderName,
                senderType,
                organizationName: event.organizations?.name || 'Community Event'
              })
            }).catch(error => {
              console.error(`Failed to send notification to ${user.email}:`, error);
            })
          );
        }
      }
    }

    // Also notify the organization (if message is from a user)
    if (senderType === 'user' && event.organizations?.user_id) {
      const { data: orgUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', event.organizations.user_id)
        .single();

      if (orgUser?.email && orgUser.id !== chatMessage.user_id) {
        // Check organization user's notification preferences
        const orgPreferences = await getUserNotificationPreferences(orgUser.id);
        
        if (orgPreferences?.chat_notifications && orgPreferences.email_frequency === 'immediate') {
          emailPromises.push(
            fetch(`${emailServiceUrl}/api/send-chat-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail: orgUser.email,
                eventTitle: event.title,
                message: chatMessage.message,
                senderName,
                senderType,
                organizationName: event.organizations?.name || 'Community Event'
              })
            }).catch(error => {
              console.error(`Failed to send notification to organization ${orgUser.email}:`, error);
            })
          );
        }
      }
    }

    // Send all emails
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
      console.log(`Sent ${emailPromises.length} chat notification emails`);
    }

  } catch (error) {
    console.error('Error sending chat notifications:', error);
  }
};

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

// Direct email notification system implementation complete
// Notifications are sent immediately when chat messages are posted
// User preferences are checked and respected before sending emails
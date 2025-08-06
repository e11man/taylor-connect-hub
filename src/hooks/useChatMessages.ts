import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendChatMessage } from '@/utils/chatNotificationService';

export interface ChatMessage {
  id: string;
  message: string;
  is_anonymous: boolean;
  user_id: string | null;
  organization_id: string | null;
  created_at: string;
  user_email?: string;
  organization_name?: string;
  user_role?: string;
}

export const useChatMessages = (eventId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          is_anonymous,
          user_id,
          organization_id,
          created_at,
          profiles!left(email, role),
          organizations!left(name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const processedMessages = data?.map(msg => ({
        id: msg.id,
        message: msg.message,
        is_anonymous: msg.is_anonymous,
        user_id: msg.user_id,
        organization_id: msg.organization_id,
        created_at: msg.created_at,
        user_email: msg.profiles?.email || 'Unknown User',
        user_role: msg.profiles?.role || 'user',
        organization_name: msg.organizations?.name || 'Unknown Organization'
      })) || [];

      setMessages(processedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const sendMessage = useCallback(async (
    content: string,
    userId: string,
    isAnonymous: boolean = false,
    organizationId: string | null = null
  ) => {
    if (!content.trim() || !eventId) {
      throw new Error('Message content and event ID are required');
    }

    try {
      const result = await sendChatMessage(
        content.trim(),
        eventId,
        userId,
        isAnonymous,
        organizationId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Refresh messages after sending
      await fetchMessages();
      
      return { success: true };
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [eventId, fetchMessages]);

  const subscribeToMessages = useCallback(() => {
    if (!eventId) return null;

    const channel = supabase
      .channel(`chat-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          // Refetch messages when new ones are added
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages();
    return unsubscribe || undefined;
  }, [subscribeToMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages
  };
};
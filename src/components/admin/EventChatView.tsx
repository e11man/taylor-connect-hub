import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, User, Shield, X } from 'lucide-react';
import { sendChatMessage } from '@/utils/chatNotificationService';

interface ChatMessage {
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

interface EventChatViewProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const EventChatView: React.FC<EventChatViewProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !eventId) return;

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`admin-chat-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // Fetch the new message with user details
          fetchNewMessage(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, eventId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
        return;
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
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
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
        .eq('id', messageId)
        .single();

      if (error || !data) return;

      const processedMessage = {
        id: data.id,
        message: data.message,
        is_anonymous: data.is_anonymous,
        user_id: data.user_id,
        organization_id: data.organization_id,
        created_at: data.created_at,
        user_email: data.profiles?.email || 'Unknown User',
        user_role: data.profiles?.role || 'user',
        organization_name: data.organizations?.name || 'Unknown Organization'
      };

      setMessages(prev => [...prev, processedMessage]);
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !eventId || sending) return;
    
    setSending(true);
    try {
      // First, get or create Community Connect organization for admin messages
      let communityConnectOrgId = null;
      
      const { data: existingOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Community Connect')
        .single();
      
      if (existingOrg) {
        communityConnectOrgId = existingOrg.id;
        console.log('Using existing Community Connect org:', communityConnectOrgId);
      } else {
        // Create Community Connect organization for admin messages
        console.log('Creating new Community Connect organization...');
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            name: 'Community Connect',
            contact_email: 'admin@communityconnect.org',
            status: 'approved',
            user_id: user.id, // Use current admin user as placeholder
            description: 'Administrative organization for Community Connect platform'
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating Community Connect org:', createError);
          // Fallback: try to send without organization ID
          communityConnectOrgId = null;
        } else {
          communityConnectOrgId = newOrg?.id;
          console.log('Created Community Connect org:', communityConnectOrgId);
        }
      }

      // Use the existing chat notification service
      console.log('Sending message with params:', {
        eventId,
        message: newMessage.trim(),
        userId: user.id,
        organizationId: communityConnectOrgId
      });
      
      const result = await sendChatMessage(
        eventId,
        newMessage.trim(),
        false, // admin messages are not anonymous
        user.id,
        communityConnectOrgId  // Send as Community Connect organization
      );

      console.log('Send message result:', result);

      if (result.success) {
        setNewMessage('');
        toast({
          title: "Message sent",
          description: "Your message has been sent as Community Connect",
        });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isAdmin = (message: ChatMessage) => {
    return message.user_role === 'admin';
  };

  const isCurrentUser = (message: ChatMessage) => {
    return message.user_id === user?.id;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl sm:max-h-[80vh] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#1B365F]" />
              <div>
                <DialogTitle className="text-lg font-semibold text-[#1B365F]">
                  Event Chat: {eventTitle}
                </DialogTitle>
                <p className="text-sm text-[#525f7f] mt-1">
                  Admin View - Monitor and participate as Community Connect
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B365F] mx-auto mb-2"></div>
                  <p className="text-sm text-[#525f7f]">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-lg text-[#525f7f] font-medium">No messages yet</p>
                <p className="text-sm text-gray-400">Be the first to start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const showDate = !prevMessage || 
                    formatDate(message.created_at) !== formatDate(prevMessage.created_at);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${message.organization_name === 'Community Connect' || isCurrentUser(message) ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          message.organization_name === 'Community Connect'
                            ? 'bg-[#00AFCE] text-white rounded-br-md'
                            : isCurrentUser(message)
                            ? 'bg-[#1B365F] text-white rounded-br-md'
                            : isAdmin(message)
                            ? 'bg-purple-500 text-white rounded-bl-md'
                            : message.organization_id
                            ? 'bg-[#00AFCE] text-white rounded-bl-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          {/* Sender info */}
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-3 h-3" />
                            <span className="text-xs opacity-90 font-medium">
                              {message.organization_name === 'Community Connect' ? 'Community Connect' : message.organization_id ? message.organization_name : message.user_email}
                            </span>
                            {message.organization_name === 'Community Connect' && (
                              <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                <Shield className="w-3 h-3" />
                                <span>Platform Admin</span>
                              </div>
                            )}
                            {isAdmin(message) && message.organization_name !== 'Community Connect' && (
                              <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                <Shield className="w-3 h-3" />
                                <span>Admin</span>
                              </div>
                            )}
                            {message.organization_id && message.organization_name !== 'Community Connect' && (
                              <div className="flex items-center bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                <span>Host</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Message content */}
                          <p className="text-sm leading-relaxed break-words">{message.message}</p>
                          
                          {/* Timestamp */}
                          <div className="text-xs opacity-75 mt-2">
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Message input */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[#525f7f]">
                <Shield className="w-4 h-4 text-[#00AFCE]" />
                <span className="font-medium">Sending as Community Connect</span>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message as Community Connect..."
                className="flex-1"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-[#1B365F] hover:bg-[#1B365F]/90 text-white px-6"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
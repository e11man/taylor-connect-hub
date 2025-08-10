import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Send, MessageCircle } from 'lucide-react';
import { sendChatMessage } from '@/utils/chatNotificationService';

interface ChatMessage {
  id: string;
  message: string;
  is_anonymous: boolean;
  user_id: string | null;
  organization_id: string | null;
  created_at: string;
  organization_name: string | null;
  user_role?: string;
}

interface EventChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  organizationId: string;
}

export const EventChatModal = ({ isOpen, onClose, eventId, eventTitle, organizationId }: EventChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if current user is the host organization
  const [isHost, setIsHost] = useState(false);
  const [userOrganization, setUserOrganization] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkHostStatus = async () => {
      if (!user) return;
      
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (orgData) {
        setUserOrganization(orgData);
        setIsHost(orgData.id === organizationId);
      }
    };

    checkHostStatus();
  }, [user, organizationId]);

  useEffect(() => {
    if (!isOpen) return;

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
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
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        event_id,
        user_id,
        organization_id,
        message,
        is_anonymous,
        created_at,
        updated_at,
        organizations(name),
        profiles!left(role)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
      return;
    }

    const formattedMessages = data?.map((msg: any) => ({
      ...msg,
      organization_name: msg.organizations?.name || null,
      user_role: msg.profiles?.role || 'user',
    })) || [];

    setMessages(formattedMessages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    
    try {
      const result = await sendChatMessage(
        eventId,
        newMessage.trim(),
        !isHost, // Only hosts are not anonymous
        user?.id,
        isHost && userOrganization ? userOrganization.id : undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      setNewMessage('');

      toast({
        title: "Message sent",
        description: "Your message has been posted to the chat and notifications sent",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMessageSender = (message: ChatMessage) => {
    if (message.organization_id) {
      return `${message.organization_name || 'Organization'} (Host)`;
    } else if (message.is_anonymous || !message.user_id) {
      return 'Anonymous';
    } else {
      return 'Volunteer';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat - {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[400px] p-6" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="mb-4">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-400">No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                const alignRight = !!message.organization_id || message.user_role === 'admin';
                return (
                  <div key={message.id} className="flex flex-col">
                    {/* Message bubble */}
                    <div className={`flex ${alignRight ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        alignRight
                          ? 'bg-[#00AFCE] text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{message.message}</p>
                      </div>
                    </div>
                    
                    {/* Sender and time info */}
                    <div className={`flex ${alignRight ? 'justify-end' : 'justify-start'} px-2`}>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">
                          {formatMessageSender(message)}
                        </span>
                        <span>•</span>
                        <span>{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="space-y-3">
            {!user && (
              <div className="text-sm text-muted-foreground">
                You can post anonymously without signing in.
              </div>
            )}
            
            {user && !isHost && (
              <div className="text-sm text-muted-foreground">
                Your messages will be posted anonymously.
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="pr-12 py-3 rounded-full border-2 border-gray-200 focus:border-[#00AFCE] transition-colors"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={loading || !newMessage.trim()}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#00AFCE] hover:bg-[#00AFCE]/90 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
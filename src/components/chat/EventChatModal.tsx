import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  is_anonymous: boolean;
  user_id: string | null;
  organization_id: string | null;
  created_at: string;
  organizations?: { name: string };
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
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        *,
        organizations (name)
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

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    
    try {
      const messageData: any = {
        event_id: eventId,
        message: newMessage.trim(),
        is_anonymous: isAnonymous && !isHost, // Hosts can't be anonymous
      };

      if (isHost && userOrganization) {
        messageData.organization_id = userOrganization.id;
      } else if (!isAnonymous && user) {
        messageData.user_id = user.id;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setIsAnonymous(false);

      toast({
        title: "Message sent",
        description: "Your message has been posted to the chat",
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
      return `${message.organizations?.name || 'Organization'} (Host)`;
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

        <ScrollArea className="flex-1 min-h-[400px] p-4 border rounded-lg" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      {formatMessageSender(message)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-3 pt-4 border-t">
          {!isHost && !user && (
            <div className="text-sm text-muted-foreground">
              You can post anonymously or{' '}
              <button className="text-primary underline">sign in</button> to post as a volunteer.
            </div>
          )}
          
          {!isHost && user && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              <span>Post anonymously</span>
            </label>
          )}

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
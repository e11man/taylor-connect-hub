import { useState, useEffect } from "react";
import { Users, Calendar, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

interface Participant {
  id: string;
  user_id: string;
  signed_up_at: string;
  profile: {
    email: string;
    dorm: string;
    wing: string;
  };
}

export const ViewParticipantsModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: ViewParticipantsModalProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchParticipants();
    }
  }, [isOpen, eventId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select(`
          id,
          user_id,
          signed_up_at
        `)
        .eq('event_id', eventId)
        .order('signed_up_at', { ascending: true });

      if (error) throw error;

      // Get user profiles separately
      const userIds = data?.map(p => p.user_id) || [];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, email, dorm, wing')
          .in('user_id', userIds);

        profiles = profileData?.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {}) || {};
      }

      // Map the data with profiles
      const participantsWithProfiles = data?.map(participant => ({
        ...participant,
        profile: profiles[participant.user_id]
      })).filter(p => p.profile) || [];

      setParticipants(participantsWithProfiles);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupedParticipants = participants.reduce((acc, participant) => {
    const key = `${participant.profile.dorm}-${participant.profile.wing}`;
    if (!acc[key]) {
      acc[key] = {
        dorm: participant.profile.dorm,
        wing: participant.profile.wing,
        participants: []
      };
    }
    acc[key].participants.push(participant);
    return acc;
  }, {} as Record<string, any>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-montserrat font-bold text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Event Participants
          </DialogTitle>
          <p className="text-muted-foreground">
            {eventTitle} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading participants...
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No participants signed up yet.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedParticipants).map((group: any) => (
                <div key={`${group.dorm}-${group.wing}`} className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {group.dorm} - {group.wing} ({group.participants.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {group.participants.map((participant: Participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          
                          <div>
                            <p className="font-medium text-sm">
                              {participant.profile.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {participant.profile.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(participant.signed_up_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
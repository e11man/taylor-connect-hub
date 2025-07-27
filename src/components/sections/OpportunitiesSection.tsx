import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, MessageCircle, Eye } from "lucide-react";
import { formatEventDate, formatEventTime, formatParticipants } from "@/utils/formatEvent";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EventChatModal } from "@/components/chat/EventChatModal";
import GroupSignupModal from "@/components/modals/GroupSignupModal";
import { ViewParticipantsModal } from "@/components/modals/ViewParticipantsModal";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  image_url: string;
  organization_id: string;
}

interface UserEvent {
  event_id: string;
}

type UserRole = 'pa' | 'admin' | 'user' | '' | null;

const OpportunitiesSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupSignupModalOpen, setGroupSignupModalOpen] = useState(false);
  const [viewParticipantsModalOpen, setViewParticipantsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userRoleLoading, setUserRoleLoading] = useState(false);
  const [eventSignupCounts, setEventSignupCounts] = useState<Record<string, number>>({});
  const { user, refreshUserEvents, userEventsRefreshTrigger, eventsRefreshTrigger } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchEventSignupCounts();
    if (user) {
      fetchUserEvents();
      fetchUserRole();
    }
  }, [user, userEventsRefreshTrigger, eventsRefreshTrigger]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user events:', error);
      } else {
        setUserEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const fetchUserRole = async () => {
    if (!user || userRoleLoading || userRole !== null) return;
    
    setUserRoleLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(''); // Set empty string to indicate role was fetched but not found
      } else {
        setUserRole(data?.role || '');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(''); // Set empty string to indicate role was fetched but not found
    } finally {
      setUserRoleLoading(false);
    }
  };

  const fetchEventSignupCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_id');

      if (error) {
        console.error('Error fetching signup counts:', error);
      } else {
        const counts = data?.reduce((acc: Record<string, number>, curr) => {
          acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
          return acc;
        }, {}) || {};
        setEventSignupCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching signup counts:', error);
    }
  };

  const handleSignUp = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to sign up for events.",
        variant: "destructive",
      });
      return;
    }

    // Check if user already has 2 commitments (PAs are exempt)
    if (userEvents.length >= 2 && userRole !== 'pa') {
      toast({
        title: "Maximum commitments reached",
        description: "You can only sign up for 2 opportunities at a time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_events')
        .insert([{ user_id: user.id, event_id: eventId }]);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "You have successfully signed up for this event.",
        });
        fetchUserEvents();
        fetchEventSignupCounts();
        // Trigger refresh in other components (like UserDashboard)
        refreshUserEvents();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSignedUp = (eventId: string) => {
    return userEvents.some(userEvent => userEvent.event_id === eventId);
  };

  const handleGroupSignup = (event: Event) => {
    setSelectedEvent(event);
    setGroupSignupModalOpen(true);
  };

  const handleGroupSignupSuccess = () => {
    fetchUserEvents();
    fetchEventSignupCounts();
    refreshUserEvents();
  };

  if (loading) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">


        {/* Opportunities Horizontal Scroll */}
        <div className="mb-12">
          <div className="flex gap-6 overflow-x-auto pb-4" style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            <style>
              {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
            </style>
          {events.map((event, index) => (
            <div 
              key={event.id}
              className="group animate-scale-in flex-shrink-0 w-80 min-w-80"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 h-full flex flex-col min-h-[400px]">
                {/* Title and Description */}
                <h3 className="text-xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-all duration-300">
                  {event.title}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {event.description}
                </p>

                {/* Key Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Date:</span>
                    <span className="text-muted-foreground">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Time:</span>
                    <span className="text-muted-foreground">
                      {formatEventTime(event.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground truncate">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Participants:</span>
                    <span className="text-muted-foreground">
                      {formatParticipants(eventSignupCounts[event.id] || 0, event.max_participants)}
                    </span>
                    {user && userRole === 'pa' && eventSignupCounts[event.id] > 0 && (
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setViewParticipantsModalOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1 ml-2"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-3">
                  {user && isSignedUp(event.id) && (
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setChatModalOpen(true);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                  )}

                  {/* Show both buttons side by side for PA users who haven't signed up */}
                  {user && userRole === 'pa' && !isSignedUp(event.id) ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <PrimaryButton 
                        onClick={() => handleSignUp(event.id)}
                        className="flex-1 bg-[#E14F3D] hover:bg-[#E14F3D]/90"
                        disabled={userEvents.length >= 2}
                      >
                        Sign Up
                      </PrimaryButton>
                      <button
                        onClick={() => handleGroupSignup(event)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors"
                        data-testid="add-group-button"
                      >
                        <Users className="w-4 h-4" />
                        Add Group
                      </button>
                    </div>
                  ) : (
                    <>
                      {isSignedUp(event.id) ? (
                        <div className="w-full bg-green-100 text-green-800 text-center py-3 rounded-full font-semibold">
                          Signed Up ✓
                        </div>
                      ) : (
                        <PrimaryButton 
                          onClick={() => handleSignUp(event.id)}
                          className="w-full bg-[#E14F3D] hover:bg-[#E14F3D]/90"
                          disabled={userEvents.length >= 2 && userRole !== 'pa'}
                        >
                          {userEvents.length >= 2 && userRole !== 'pa' ? 'Max Reached' : 'Sign Up'}
                        </PrimaryButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* View More button removed */}
      </div>

      {selectedEvent && (
        <EventChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          organizationId={selectedEvent.organization_id || ''}
        />
      )}

      {selectedEvent && (
        <GroupSignupModal
          isOpen={groupSignupModalOpen}
          onClose={() => {
            setGroupSignupModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          maxParticipants={selectedEvent.max_participants}
          currentSignups={eventSignupCounts[selectedEvent.id] || 0}
          onSignupSuccess={handleGroupSignupSuccess}
        />
      )}

      {selectedEvent && (
        <ViewParticipantsModal
          isOpen={viewParticipantsModalOpen}
          onClose={() => {
            setViewParticipantsModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}
    </section>
  );
};

export default OpportunitiesSection;
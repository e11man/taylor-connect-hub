import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, MessageCircle, Search, Clock } from "lucide-react";
import { formatEventDate, formatEventTime, formatEventTimeRange, formatParticipants } from "@/utils/formatEvent";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { EventChatModal } from "@/components/chat/EventChatModal";
import GroupSignupModal from "@/components/modals/GroupSignupModal";
import UserAuthModal from "@/components/modals/UserAuthModal";
import SafetyGuidelinesModal from "@/components/modals/SafetyGuidelinesModal";
import { useSearch } from "@/contexts/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { filterUpcomingEvents, filterActiveEvents } from '@/utils/eventFilters';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
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
  const { filteredEvents, isLoading: searchLoading, error: searchError } = useSearch();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupSignupModalOpen, setGroupSignupModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSignupCounts, setEventSignupCounts] = useState<Record<string, number>>({});
  const { user, refreshUserEvents, userEventsRefreshTrigger, eventsRefreshTrigger } = useAuth();
  const { userRole, loading: userRoleLoading, isPA } = useUserRole();
  const { toast } = useToast();

  // Use filtered events from search context when available, otherwise show all events
  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;

  useEffect(() => {
    fetchEvents();
    fetchEventSignupCounts();
    if (user) {
      fetchUserEvents();
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
        // Apply filtering: show only upcoming events (not within 12 hours of start)
        // and filter out expired events
        const filteredData = filterActiveEvents(filterUpcomingEvents(data || []));
        setEvents(filteredData);
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
      setAuthModalOpen(true);
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

    // Show safety guidelines modal first
    setPendingEventId(eventId);
    setSafetyModalOpen(true);
  };

  const handleSafetyAccept = async () => {
    if (!pendingEventId || !user) return;

    setSafetyModalOpen(false);
    const eventId = pendingEventId;
    setPendingEventId(null);

    try {
      // Try API route first (with service role key)
      const response = await fetch(`${import.meta.env.DEV ? 'http://localhost:3001' : ''}/api/event-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          event_id: eventId
        })
      });

      if (!response.ok) {
        // Fallback to direct Supabase call if API is not available
        const { error } = await supabase
          .from('user_events')
          .insert([{ user_id: user.id, event_id: eventId }]);

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Success!",
        description: "You have successfully signed up for this event.",
      });
      fetchUserEvents();
      fetchEventSignupCounts();
      // Trigger refresh in other components (like UserDashboard)
      refreshUserEvents();
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

  if (loading || searchLoading) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">
              {searchLoading ? 'Searching events...' : 'Loading events...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (searchError) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="w-12 h-12 text-gray-400" />
              <p className="text-xl text-muted-foreground">Search Error</p>
              <p className="text-sm text-gray-500">{searchError}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayEvents.length === 0) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <div className="flex flex-col items-center gap-4">
              <Search className="w-12 h-12 text-gray-400" />
              <p className="text-xl text-muted-foreground">No events found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="animate-slide-up mb-12">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary text-center">
            Volunteer Opportunities
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-5xl mx-auto text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Discover meaningful ways to serve your community and make a difference
          </p>
        </div>
        
        {/* Opportunities Horizontal Scroll */}
        <div className="mb-8 md:mb-12">
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-6 scroll-smooth snap-x snap-mandatory" style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <style>
              {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
            </style>
          {displayEvents.map((event, index) => (
            <div 
              key={event.id}
              className="group animate-scale-in flex-shrink-0 w-[85vw] sm:w-72 md:w-80 min-w-[85vw] sm:min-w-72 md:min-w-80 snap-start"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 h-full flex flex-col min-h-[350px] sm:min-h-[380px] md:min-h-[400px]">
                {/* Title and Description */}
                <h3 className="text-lg md:text-xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-all duration-300 line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 line-clamp-3 leading-relaxed">
                  {event.description}
                </p>

                {/* Key Details */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Date:</span>
                    <span className="text-muted-foreground truncate">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Time:</span>
                    <span className="text-muted-foreground">
                      {formatEventTimeRange(event.arrival_time, event.estimated_end_time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground truncate">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Participants:</span>
                    <span className="text-muted-foreground">
                      {formatParticipants(eventSignupCounts[event.id] || 0, event.max_participants)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-2 md:space-y-3">

                  {/* Show buttons based on user role and signup status */}
                  {(() => {
                    const isPAUser = user && isPA;
                    const userSignedUp = isSignedUp(event.id);
                    
                    // Debug log for PA detection
                    if (user) {
                      console.log('🔍 PA Detection:', {
                        userId: user.id,
                        userRole,
                        isPA,
                        isPAUser,
                        userRoleLoading
                      });
                    }
                    
                    // For PA users
                    if (isPAUser) {
                      return (
                        <div className="flex flex-col gap-2">
                          {userSignedUp ? (
                            <>
                              <div className="w-full bg-green-100 text-green-800 text-center py-3 rounded-xl font-semibold min-h-[44px] flex items-center justify-center">
                                Signed Up ✓
                              </div>
                              <button
                                onClick={() => handleGroupSignup(event)}
                                className="w-full bg-[#00AFCE] hover:bg-[#00AFCE]/90 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg min-h-[44px] touch-manipulation"
                                data-testid="add-group-button"
                              >
                                <Users className="w-4 h-4" />
                                Add Group
                              </button>
                            </>
                          ) : (
                            <>
                              <PrimaryButton 
                                onClick={() => handleSignUp(event.id)}
                                className="w-full min-h-[44px] touch-manipulation"
                                disabled={userEvents.length >= 2}
                              >
                                Sign Up
                              </PrimaryButton>
                              <SecondaryButton
                                onClick={() => handleGroupSignup(event)}
                                className="w-full min-h-[44px] touch-manipulation"
                                data-testid="add-group-button"
                              >
                                <Users className="w-4 h-4" />
                                Add Group
                              </SecondaryButton>
                            </>
                          )}
                        </div>
                      );
                    }
                    
                    // For regular users
                    return (
                      <>
                        {userSignedUp ? (
                          <div className="w-full bg-green-100 text-green-800 text-center py-3 rounded-xl font-semibold min-h-[44px] flex items-center justify-center">
                            Signed Up ✓
                          </div>
                        ) : (
                          <PrimaryButton 
                            onClick={() => handleSignUp(event.id)}
                            className="w-full min-h-[44px] touch-manipulation"
                            disabled={userEvents.length >= 2 && userRole !== 'pa'}
                          >
                            {userEvents.length >= 2 && userRole !== 'pa' ? 'Max Reached' : 'Sign Up'}
                          </PrimaryButton>
                        )}
                      </>
                    );
                  })()}
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
      
      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="login"
      />

      {/* Safety Guidelines Modal */}
      <SafetyGuidelinesModal
        isOpen={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setPendingEventId(null);
        }}
        onAccept={handleSafetyAccept}
        userType="volunteer"
      />
    </section>
  );
};

export default OpportunitiesSection;
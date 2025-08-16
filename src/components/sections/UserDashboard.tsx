import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, MessageCircle, Clock, Settings, X, Info } from "lucide-react";
import { formatEventDate, formatEventTime, formatEventTimeRange } from "@/utils/formatEvent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { EventChatModal } from "@/components/chat/EventChatModal";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DashboardOpportunities from "./DashboardOpportunities";
import AddressLink from "@/components/ui/AddressLink";
import { DynamicText } from "@/components/content/DynamicText";
import { usePageTitle } from "@/hooks/usePageTitle";

interface UserEvent {
  id: string;
  event_id: string;
  signed_up_at: string;
  events: {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    max_participants: number;
    arrival_time: string;
    estimated_end_time: string;
    meeting_point?: string | null;
    contact_person?: string | null;
    contact_person_phone?: string | null;
    special_instructions?: string | null;
  };
}

interface UserProfile {
  dorm: string;
  wing: string;
  email: string;
}

const UserDashboard = () => {
  usePageTitle("Dashboard");
  
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'opportunities' | 'profile'>('events');
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UserEvent['events'] | null>(null);
  const { user, userEventsRefreshTrigger, refreshUserEvents } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
      // Trigger manual cleanup when dashboard loads
      triggerManualCleanup();
    }
  }, [user, userEventsRefreshTrigger]);

  // Function to check if an event is expired (same logic as backend)
  const isEventExpired = (event: UserEvent['events']) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let eventEndTime: Date;
    
    if (event.estimated_end_time) {
      // Use estimated_end_time if available
      eventEndTime = new Date(`${event.date}T${event.estimated_end_time}`);
    } else {
      // Fallback: use date + 2 hours as default end time
      const eventDate = new Date(event.date);
      eventEndTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
    }
    
    return eventEndTime < oneHourAgo;
  };

  // Function to trigger manual cleanup
  const triggerManualCleanup = async () => {
    try {
      const response = await fetch('/api/cleanup-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('Manual cleanup failed:', response.statusText);
      }
    } catch (error) {
      console.warn('Error triggering manual cleanup:', error);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user events with event details
      const { data: eventsData, error: eventsError } = await supabase
        .from('user_events')
        .select(`
          id,
          event_id,
          signed_up_at,
          events (
            id,
            title,
            description,
            date,
            location,
            max_participants,
            arrival_time,
            estimated_end_time,
            meeting_point,
            contact_person,
            contact_person_phone,
            special_instructions
          )
        `)
        .eq('user_id', user.id);

      if (eventsError) {
        console.error('Error fetching user events:', eventsError);
      } else {
        // Filter out expired events on the client side
        const filteredEvents = (eventsData || []).filter(userEvent => 
          userEvent.events && !isEventExpired(userEvent.events)
        );
        setUserEvents(filteredEvents);
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('dorm, wing, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else {
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatOpen = (event: UserEvent['events']) => {
    setSelectedEvent(event);
    setChatModalOpen(true);
  };

  const handleCancelSignup = async (userEventId: string, eventTitle: string) => {
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', userEventId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cancelled",
          description: `You have cancelled your signup for "${eventTitle}".`,
        });
        fetchUserData(); // Refresh the data
        // Trigger refresh in other components (like OpportunitiesSection)
        refreshUserEvents();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: <DynamicText page="messages" section="error" contentKey="unexpected_error" fallback="An unexpected error occurred. Please try again." />,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="bg-white section-padding">
          <div className="container-custom">
            <div className="text-center">
              <p className="text-xl text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-white section-padding">
      <div className="container-custom max-w-4xl">
        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-montserrat font-bold mb-3 sm:mb-4 lg:mb-6 text-primary">
            My Dashboard
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all text-xs sm:text-sm lg:text-base ${
                activeTab === 'events' 
                  ? 'bg-[#00AFCE] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all text-xs sm:text-sm lg:text-base ${
                activeTab === 'opportunities' 
                  ? 'bg-[#00AFCE] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Browse Opportunities
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base ${
                activeTab === 'profile' 
                  ? 'bg-[#00AFCE] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              Profile
            </button>
          </div>
        </div>

        {activeTab === 'events' ? (
          <>
            {/* My Commitments */}
            <div className="mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-montserrat font-bold mb-4 sm:mb-6 text-primary">
                My Commitments
              </h2>
          
          {userEvents.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-2xl sm:rounded-3xl mx-2 sm:mx-0">
              <p className="text-muted-foreground mb-2 text-sm sm:text-base px-4">
                You haven't committed to any opportunities yet.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base px-4">
                Browse below and join up to 2 opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {userEvents.map((userEvent) => (
                <div 
                  key={userEvent.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:border-[#00AFCE] transition-all duration-300 mx-2 sm:mx-0"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-montserrat font-bold text-primary pr-2 flex-1">
                      {userEvent.events.title}
                    </h3>
                    <button
                      onClick={() => handleCancelSignup(userEvent.id, userEvent.events.title)}
                      className="p-1 sm:p-2 text-gray-400 hover:text-[#E14F3D] transition-colors flex-shrink-0"
                      title="Cancel signup"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  
                  <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
                    {userEvent.events.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0" />
                      <span className="font-medium text-primary">Date:</span>
                      <span className="text-muted-foreground truncate">
                        {formatEventDate(userEvent.events.date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0" />
                      <span className="font-medium text-primary">Time:</span>
                      <span className="text-muted-foreground truncate">
                        {formatEventTimeRange(userEvent.events.arrival_time, userEvent.events.estimated_end_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-primary">Location:</span>
                      <AddressLink address={userEvent.events.location} className="text-muted-foreground break-words" />
                    </div>

                    {/* Optional Fields - only show if they exist */}
                    {userEvent.events.meeting_point && (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0" />
                        <span className="font-medium text-primary">Meeting Point:</span>
                        <span className="text-muted-foreground">{userEvent.events.meeting_point}</span>
                      </div>
                    )}

                    {userEvent.events.contact_person && (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0" />
                        <span className="font-medium text-primary">Contact:</span>
                        <span className="text-muted-foreground">{userEvent.events.contact_person}</span>
                        {userEvent.events.contact_person_phone && (
                          <span className="text-muted-foreground"> • {userEvent.events.contact_person_phone}</span>
                        )}
                      </div>
                    )}

                    {userEvent.events.special_instructions && (
                      <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#00AFCE] flex-shrink-0 mt-0.5" />
                        <span className="font-medium text-primary">Instructions:</span>
                        <span className="text-muted-foreground">{userEvent.events.special_instructions}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Signed up on {new Date(userEvent.signed_up_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleChatOpen(userEvent.events)}
                        className="bg-[#00AFCE] hover:bg-[#00AFCE]/90 text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg min-h-[36px] touch-manipulation"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

          </>
        ) : activeTab === 'opportunities' ? (
          <DashboardOpportunities />
        ) : (
          <div className="space-y-6">
            <ProfileSettings />
            <NotificationPreferences />
          </div>
        )}
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
          organizationId="" // We may need to add organization_id to the UserEvent interface and fetch it
        />
      )}
      </section>
      <Footer />
    </div>
  );
};

export default UserDashboard;
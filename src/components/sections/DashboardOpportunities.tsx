import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Users, MessageCircle, Search, Clock, Filter, X } from "lucide-react";
import { formatEventDate, formatEventTime, formatEventTimeRange, formatParticipants } from "@/utils/formatEvent";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { EventChatModal } from "@/components/chat/EventChatModal";
import GroupSignupModal from "@/components/modals/GroupSignupModal";
import SafetyGuidelinesModal from "@/components/modals/SafetyGuidelinesModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { filterUpcomingEvents, filterActiveEvents, filterEventsByAvailability, calculateEventAvailability, filterNextOccurrencePerSeries } from '@/utils/eventFilters';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  currentParticipants?: number;
  availableSpots?: number;
  isFull?: boolean;
}

interface UserEvent {
  event_id: string;
}

type UserRole = 'pa' | 'admin' | 'user' | '' | null;

const DashboardOpportunities = () => {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupSignupModalOpen, setGroupSignupModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSignupCounts, setEventSignupCounts] = useState<Record<string, number>>({});
  const { user, refreshUserEvents, userEventsRefreshTrigger, eventsRefreshTrigger } = useAuth();
  const { userRole, loading: userRoleLoading, isPA } = useUserRole();
  const { toast } = useToast();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFullEvents, setShowFullEvents] = useState(false);
  const [showAllOccurrences, setShowAllOccurrences] = useState(false);

  // Process events to add availability information
  const processedEvents = useMemo(() => {
    return events.map(event => {
      const currentParticipants = eventSignupCounts[event.id] || 0;
      const { availableSpots, isFull } = calculateEventAvailability({
        ...event,
        currentParticipants
      });
      
      return {
        ...event,
        currentParticipants,
        availableSpots,
        isFull
      };
    });
  }, [events, eventSignupCounts]);

  useEffect(() => {
    fetchEvents();
    fetchEventSignupCounts();
    if (user) {
      fetchUserEvents();
    }
  }, [user, userEventsRefreshTrigger, eventsRefreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, dateFilter, locationFilter, statusFilter, userEvents, showFullEvents, showAllOccurrences]);

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
        console.error('Error fetching event signup counts:', error);
      } else {
        const counts: Record<string, number> = {};
        data?.forEach((userEvent) => {
          counts[userEvent.event_id] = (counts[userEvent.event_id] || 0) + 1;
        });
        setEventSignupCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching event signup counts:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...processedEvents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        switch (dateFilter) {
          case 'today':
            return eventDate.getTime() === today.getTime();
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDate >= today && eventDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return eventDate >= today && eventDate <= monthFromNow;
          case 'upcoming':
            return eventDate >= today;
          default:
            return true;
        }
      });
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const signedUpEventIds = userEvents.map(ue => ue.event_id);
      switch (statusFilter) {
        case 'signed-up':
          filtered = filtered.filter(event => signedUpEventIds.includes(event.id));
          break;
        case 'not-signed-up':
          filtered = filtered.filter(event => !signedUpEventIds.includes(event.id));
          break;
        case 'available':
          filtered = filtered.filter(event => !event.isFull);
          break;
        default:
          break;
      }
    }

    // Full events filter
    filtered = filterEventsByAvailability(filtered, showFullEvents);

    // Occurrence filter: by default show only next occurrence per series
    filtered = filterNextOccurrencePerSeries(filtered, !showAllOccurrences);

    setFilteredEvents(filtered);
  };

  const handleSignUp = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sign up for events.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has already signed up
    const isAlreadySignedUp = userEvents.some(ue => ue.event_id === eventId);
    if (isAlreadySignedUp) {
      toast({
        title: "Already Signed Up",
        description: "You have already signed up for this event.",
        variant: "destructive",
      });
      return;
    }

    // Show safety guidelines modal for all users
    setPendingEventId(eventId);
    setSafetyModalOpen(true);
  };

  const handleSafetyAccept = async () => {
    if (!pendingEventId) return;

    try {
      let signupSuccessful = false;
      let errorMessage = "";

      try {
        // Try API route first (with service role key)
        const response = await fetch(`${import.meta.env.DEV ? 'http://localhost:3001' : ''}/api/event-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            event_id: pendingEventId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            signupSuccessful = true;
          } else {
            errorMessage = result.error || "API signup failed";
          }
        } else {
          // API server not available, try fallback
          throw new Error("API server not available");
        }
      } catch (apiError) {
        console.log("API signup failed, trying direct Supabase call:", apiError);
        
        // Fallback to direct Supabase call if API is not available
        const { error } = await supabase
          .from('user_events')
          .insert([{ user_id: user?.id, event_id: pendingEventId }]);

        if (error) {
          errorMessage = error.message;
        } else {
          signupSuccessful = true;
        }
      }

      if (signupSuccessful) {
        toast({
          title: "Success!",
          description: "You have successfully signed up for this event.",
        });
        fetchUserEvents();
        fetchEventSignupCounts();
        refreshUserEvents();
      } else {
        toast({
          title: "Error",
          description: errorMessage || "Failed to sign up for event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error signing up for event:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSafetyModalOpen(false);
      setPendingEventId(null);
    }
  };

  const isSignedUp = (eventId: string) => {
    return userEvents.some(ue => ue.event_id === eventId);
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

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setShowFullEvents(false);
  };

  const getUniqueLocations = () => {
    const locations = events.map(event => event.location);
    return Array.from(new Set(locations)).sort();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-xl text-muted-foreground">Loading opportunities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-montserrat font-bold text-primary">
          Browse Opportunities
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Search - Full width on mobile */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filter Row 1 - Date and Location */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full h-12 text-sm">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          {/* Location Filter */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full h-12 text-sm">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {getUniqueLocations().map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Row 2 - Status and Full Events */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-12 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="signed-up">Signed Up</SelectItem>
              <SelectItem value="not-signed-up">Not Signed Up</SelectItem>
              <SelectItem value="available">Available Spots</SelectItem>
            </SelectContent>
          </Select>

          {/* Full Events Filter */}
          <div className="flex items-center justify-center h-12 px-3 bg-white rounded-md border border-input">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showFullEvents}
                onChange={(e) => setShowFullEvents(e.target.checked)}
                className="w-4 h-4 text-[#00AFCE] bg-gray-100 border-gray-300 rounded focus:ring-[#00AFCE] focus:ring-2"
              />
              <span>Show full events</span>
            </label>
          </div>
        </div>

        {/* Filter Row 3 - Occurrence toggle */}
        <div className="grid grid-cols-1">
          <div className="flex items-center justify-start h-12 px-3 bg-white rounded-md border border-input">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAllOccurrences}
                onChange={(e) => setShowAllOccurrences(e.target.checked)}
                className="w-4 h-4 text-[#00AFCE] bg-gray-100 border-gray-300 rounded focus:ring-[#00AFCE] focus:ring-2"
              />
              <span>Show all occurrences</span>
            </label>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || dateFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {searchTerm && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs sm:text-sm">
                <span className="truncate max-w-20 sm:max-w-none">Search: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="ml-1 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {dateFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs sm:text-sm">
                <span className="truncate max-w-16 sm:max-w-none">Date: {dateFilter}</span>
                <button onClick={() => setDateFilter('all')} className="ml-1 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {locationFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs sm:text-sm">
                <span className="truncate max-w-20 sm:max-w-none">Location: {locationFilter}</span>
                <button onClick={() => setLocationFilter('all')} className="ml-1 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {statusFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs sm:text-sm">
                <span className="truncate max-w-16 sm:max-w-none">Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('all')} className="ml-1 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">No events found</p>
          <p className="text-xs sm:text-sm text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((event) => {
            const isUserSignedUp = isSignedUp(event.id);

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
              >
                {/* Title and Description */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-montserrat font-bold text-primary line-clamp-2 flex-1">
                    {event.title}
                  </h3>
                  {event.isFull && (
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0">
                      Event Full
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3">
                  {event.description}
                </p>

                {/* Key Details */}
                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
                    <Calendar className="w-3 h-3 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Date:</span>
                    <span className="text-muted-foreground">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
                    <Clock className="w-3 h-3 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Time:</span>
                    <span className="text-muted-foreground">
                      {formatEventTimeRange(event.arrival_time, event.estimated_end_time)}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-1.5 sm:gap-2 text-xs">
                    <MapPin className="w-3 h-3 text-[#00AFCE] flex-shrink-0 mt-0.5" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground break-words">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
                    <Users className="w-3 h-3 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Participants:</span>
                    <span className="text-muted-foreground">
                      {event.currentParticipants || 0} / {event.max_participants} participants
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 md:flex-col">
                  {isPA ? (
                    // PA: Add Group first, then primary CTA; stacked at all breakpoints
                    <>
                      <SecondaryButton
                        onClick={() => handleGroupSignup(event)}
                        disabled={event.isFull}
                        className="w-full h-10 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Add Group
                      </SecondaryButton>
                      {isUserSignedUp ? (
                        <SecondaryButton className="w-full bg-green-100 text-green-800 border-green-200 hover:bg-green-200 h-10">
                          Signed Up ✓
                        </SecondaryButton>
                      ) : (
                        <PrimaryButton
                          onClick={() => handleSignUp(event.id)}
                          disabled={event.isFull}
                          className="w-full h-10"
                        >
                          {event.isFull ? 'Full' : 'Sign Up'}
                        </PrimaryButton>
                      )}
                    </>
                  ) : (
                    // Non-PA: preserve existing behavior
                    <>
                      {isUserSignedUp ? (
                        <SecondaryButton className="w-full sm:w-auto bg-green-100 text-green-800 border-green-200 hover:bg-green-200 h-10 sm:h-auto">
                          Signed Up ✓
                        </SecondaryButton>
                      ) : (
                        <PrimaryButton
                          onClick={() => handleSignUp(event.id)}
                          disabled={event.isFull}
                          className="w-full sm:w-auto h-10 sm:h-auto"
                        >
                          {event.isFull ? 'Full' : 'Sign Up'}
                        </PrimaryButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SafetyGuidelinesModal
        isOpen={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setPendingEventId(null);
        }}
        onAccept={handleSafetyAccept}
        userType="volunteer"
      />

      <GroupSignupModal
        isOpen={groupSignupModalOpen}
        onClose={() => setGroupSignupModalOpen(false)}
        eventId={selectedEvent?.id || ''}
        eventTitle={selectedEvent?.title || ''}
        maxParticipants={selectedEvent?.max_participants || 0}
        currentSignups={eventSignupCounts[selectedEvent?.id || ''] || 0}
        onSignupSuccess={handleGroupSignupSuccess}
      />

      {selectedEvent && (
        <EventChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          organizationId={selectedEvent.organization_id}
        />
      )}
    </div>
  );
};

export default DashboardOpportunities; 
import { Calendar, MapPin, Users, Star, ArrowRight } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  image_url: string;
}

interface UserEvent {
  event_id: string;
}

const OpportunitiesSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

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

  const handleSignUp = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to sign up for events.",
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
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
            Current Opportunities
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find ways to make a meaningful difference in our community.
          </p>
        </div>

        {/* Opportunities Grid - Mobile Horizontal Scroll */}
        <div className="mb-12">
          <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {events.map((event, index) => (
            <div 
              key={event.id}
              className="group animate-scale-in flex-shrink-0 w-56 min-w-56 md:w-auto"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 h-full flex flex-col">
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
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Time:</span>
                    <span className="text-muted-foreground">
                      {new Date(event.date).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground truncate">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Max Participants:</span>
                    <span className="text-muted-foreground">{event.max_participants}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {isSignedUp(event.id) ? (
                    <div className="w-full bg-green-100 text-green-800 text-center py-3 rounded-full font-semibold">
                      Signed Up ✓
                    </div>
                  ) : (
                    <PrimaryButton 
                      onClick={() => handleSignUp(event.id)}
                      className="w-full bg-[#E14F3D] hover:bg-[#E14F3D]/90"
                    >
                      Sign Up
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* View More button removed */}
      </div>
    </section>
  );
};

export default OpportunitiesSection;
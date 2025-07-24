import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, X, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";

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
  };
}

interface UserProfile {
  dorm: string;
  wing: string;
  email: string;
}

const UserDashboard = () => {
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'settings'>('events');
  const { user, userEventsRefreshTrigger, refreshUserEvents } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, userEventsRefreshTrigger]);

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
            max_participants
          )
        `)
        .eq('user_id', user.id);

      if (eventsError) {
        console.error('Error fetching user events:', eventsError);
      } else {
        setUserEvents(eventsData || []);
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('dorm, wing, email')
        .eq('user_id', user.id)
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
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white section-padding">
      <div className="container-custom max-w-4xl">
        {/* Tab Navigation */}
        <div className="mb-8">
          <h1 className="text-4xl font-montserrat font-bold mb-6 text-primary">
            My Dashboard
          </h1>
          
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'events' 
                  ? 'bg-[#00AFCE] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'settings' 
                  ? 'bg-[#00AFCE] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {activeTab === 'events' ? (
          <>
            {/* My Commitments */}
            <div className="mb-12">
              <h2 className="text-3xl font-montserrat font-bold mb-6 text-primary">
                My Commitments
              </h2>
          
          {userEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl">
              <p className="text-muted-foreground mb-2">
                You haven't committed to any opportunities yet.
              </p>
              <p className="text-muted-foreground">
                Browse below and join up to 2 opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {userEvents.map((userEvent) => (
                <div 
                  key={userEvent.id}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-montserrat font-bold text-primary">
                      {userEvent.events.title}
                    </h3>
                    <button
                      onClick={() => handleCancelSignup(userEvent.id, userEvent.events.title)}
                      className="p-2 text-gray-400 hover:text-[#E14F3D] transition-colors"
                      title="Cancel signup"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {userEvent.events.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-[#00AFCE]" />
                      <span className="font-medium text-primary">Date:</span>
                      <span className="text-muted-foreground">
                        {new Date(userEvent.events.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-[#00AFCE]" />
                      <span className="font-medium text-primary">Time:</span>
                      <span className="text-muted-foreground">
                        {new Date(userEvent.events.date).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-[#00AFCE]" />
                      <span className="font-medium text-primary">Location:</span>
                      <span className="text-muted-foreground">{userEvent.events.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground">
                      Signed up on {new Date(userEvent.signed_up_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            {/* My Dorm/Wing */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-montserrat font-bold text-primary">
                  My Dorm/Wing
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-[#00AFCE] text-[#00AFCE] hover:bg-[#00AFCE] hover:text-white"
                  >
                    Change Dorm
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    Update Password
                  </Button>
                </div>
              </div>
              
              {userProfile && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <p className="text-lg font-medium text-primary">
                    {userProfile.dorm} - {userProfile.wing}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {userProfile.email}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <NotificationPreferences />
        )}
      </div>
    </section>
  );
};

export default UserDashboard;
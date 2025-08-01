import { useState, useEffect } from "react";
import { Search, Users, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SafetyGuidelinesModal from "@/components/modals/SafetyGuidelinesModal";

interface GroupSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  maxParticipants: number;
  currentSignups: number;
  onSignupSuccess: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  dorm: string;
  wing: string;
  commitments: number;
}

const GroupSignupModal = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle, 
  maxParticipants, 
  currentSignups,
  onSignupSuccess 
}: GroupSignupModalProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMyFloor, setShowOnlyMyFloor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [includeMyself, setIncludeMyself] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchUsers();
    }
  }, [isOpen, user, searchTerm, showOnlyMyFloor]);

  const fetchUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get current user's profile first
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('dorm, wing')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          dorm,
          wing
        `)
        .eq('status', 'active')
        .neq('user_id', user.id); // Exclude current user from list

      // Filter by same floor if enabled
      if (showOnlyMyFloor && currentUserProfile) {
        query = query
          .eq('dorm', currentUserProfile.dorm)
          .eq('wing', currentUserProfile.wing);
      }

      const { data: profilesData, error } = await query;

      if (error) throw error;

      // Get commitment counts for each user
      const userIds = profilesData?.map(p => p.user_id) || [];
      const { data: commitmentsData } = await supabase
        .from('user_events')
        .select('user_id')
        .in('user_id', userIds);

      // Count commitments per user
      const commitmentCounts = commitmentsData?.reduce((acc: Record<string, number>, curr) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Filter users based on search term and add commitment count
      const filteredUsers = (profilesData || [])
        .map(profile => ({
          ...profile,
          commitments: commitmentCounts[profile.user_id] || 0
        }))
        .filter(profile => {
          if (!searchTerm) return true;
          return profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 profile.dorm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 profile.wing.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
          // Sort by same floor first, then by commitments (ascending)
          if (currentUserProfile) {
            const aIsSameFloor = a.dorm === currentUserProfile.dorm && a.wing === currentUserProfile.wing;
            const bIsSameFloor = b.dorm === currentUserProfile.dorm && b.wing === currentUserProfile.wing;
            
            if (aIsSameFloor && !bIsSameFloor) return -1;
            if (!aIsSameFloor && bIsSameFloor) return 1;
          }
          
          return a.commitments - b.commitments;
        });

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSubmit = () => {
    if (!user) return;

    const totalSignups = selectedUsers.size + (includeMyself ? 1 : 0);
    const availableSpots = maxParticipants - currentSignups;

    if (totalSignups > availableSpots) {
      toast({
        title: "Not enough spots",
        description: `Only ${availableSpots} spots remaining. You selected ${totalSignups} people.`,
        variant: "destructive",
      });
      return;
    }

    // Show safety guidelines modal first
    setPendingSubmit(true);
    setSafetyModalOpen(true);
  };

  const handleSafetyAccept = async () => {
    if (!user || !pendingSubmit) return;

    setSafetyModalOpen(false);
    setPendingSubmit(false);
    setSubmitting(true);
    
    try {
      const signupPromises = [];
      const signupData = [];
      
      // Sign up selected users
      for (const userId of selectedUsers) {
        signupPromises.push(
          supabase
            .from('user_events')
            .insert({
              user_id: userId,
              event_id: eventId,
              signed_up_by: user.id
            })
        );
        signupData.push({
          userId,
          eventId,
          signedUpBy: user.id
        });
      }

      // Include myself if checked
      if (includeMyself) {
        signupPromises.push(
          supabase
            .from('user_events')
            .insert({
              user_id: user.id,
              event_id: eventId,
              signed_up_by: user.id
            })
        );
        signupData.push({
          userId: user.id,
          eventId,
          signedUpBy: user.id
        });
      }

      const results = await Promise.all(signupPromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to sign up ${errors.length} users`);
      }

      // Send confirmation emails
      try {
        const emailResponse = await supabase.functions.invoke('send-signup-confirmation', {
          body: { signups: signupData }
        });
        
        if (emailResponse.error) {
          console.error('Error sending confirmation emails:', emailResponse.error);
          // Don't fail the entire operation if emails fail
        }
      } catch (emailError) {
        console.error('Error invoking email function:', emailError);
        // Don't fail the entire operation if emails fail
      }

      toast({
        title: "Success!",
        description: `Successfully signed up ${totalSignups} ${totalSignups === 1 ? 'person' : 'people'} for "${eventTitle}". Confirmation emails have been sent.`,
      });

      onSignupSuccess();
      onClose();
      setSelectedUsers(new Set());
      setIncludeMyself(false);
    } catch (error) {
      console.error('Error signing up users:', error);
      toast({
        title: "Error",
        description: "Failed to sign up users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableSpots = maxParticipants - currentSignups;
  const totalSelected = selectedUsers.size + (includeMyself ? 1 : 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl font-montserrat font-bold text-primary">
            Group Signup
          </DialogTitle>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sign up multiple people for: <span className="font-semibold">{eventTitle}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Available spots: {availableSpots} | Selected: {totalSelected}
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto px-4 sm:px-6">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sameFloor"
                  checked={showOnlyMyFloor}
                  onCheckedChange={(checked) => setShowOnlyMyFloor(checked === true)}
                />
                <label htmlFor="sameFloor" className="text-sm font-medium">
                  Show only users from my floor
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMyself"
                  checked={includeMyself}
                  onCheckedChange={(checked) => setIncludeMyself(checked === true)}
                />
                <label htmlFor="includeMyself" className="text-sm font-medium text-accent">
                  Sign myself up too
                </label>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="border rounded-lg max-h-60 sm:max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {showOnlyMyFloor ? "No users found on your floor" : "No users found"}
              </div>
            ) : (
              <div className="space-y-1 p-1 sm:p-2">
                {users.map((userProfile) => {
                  const isSelected = selectedUsers.has(userProfile.user_id);
                  const cannotSignUp = userProfile.commitments >= 2;
                  
                  return (
                    <div
                      key={userProfile.user_id}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-accent/10 border-accent' 
                          : cannotSignUp
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => !cannotSignUp && handleUserToggle(userProfile.user_id)}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <Checkbox
                          checked={isSelected}
                          disabled={cannotSignUp}
                          className="pointer-events-none flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {userProfile.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {userProfile.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userProfile.dorm} - {userProfile.wing}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          Commitments: {userProfile.commitments}/2
                        </div>
                        {cannotSignUp && (
                          <div className="text-xs text-red-500 font-medium whitespace-nowrap">
                            Maximum reached
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 px-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              {totalSelected} {totalSelected === 1 ? 'person' : 'people'} selected
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={totalSelected === 0 || totalSelected > availableSpots || submitting}
                className="w-full sm:w-auto order-1 sm:order-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing Up...
                  </span>
                ) : (
                  `Sign Up ${totalSelected} ${totalSelected === 1 ? 'Person' : 'People'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Safety Guidelines Modal */}
    <SafetyGuidelinesModal
      isOpen={safetyModalOpen}
      onClose={() => {
        setSafetyModalOpen(false);
        setPendingSubmit(false);
      }}
      onAccept={handleSafetyAccept}
    />
    </>
  );
};

export default GroupSignupModal;
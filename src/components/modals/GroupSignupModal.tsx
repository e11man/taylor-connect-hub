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
  role?: 'admin' | 'pa' | 'user';
  user_type?: string | null;
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
  const [showOnlyMyFloor, setShowOnlyMyFloor] = useState(false);
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
      // Get current user's profile first - use 'id' field, not 'user_id'
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('dorm, wing')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current user profile:', profileError);
        throw profileError;
      }

      // Get all active profiles first, then filter client-side
      const { data: allProfilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          dorm,
          wing,
          role,
          user_type
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Client-side filtering to exclude current user and ensure only regular users (role=user)
      // Include all user_types except 'organization' to be robust
      let profilesData = (allProfilesData || [])
        .filter(profile => profile.id !== user.id)
        .filter(profile => (profile.role === 'user') && (profile.user_type !== 'organization'));

      // Filter by same floor if enabled
      if (showOnlyMyFloor && currentUserProfile && currentUserProfile.dorm && currentUserProfile.wing) {
        profilesData = profilesData.filter(profile => 
          profile.dorm === currentUserProfile.dorm && 
          profile.wing === currentUserProfile.wing
        );
      }

      // Get commitment counts for each user
      const userIds = profilesData?.map(p => p.id) || [];
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
      const filteredUsers = profilesData
        .map(profile => ({
          ...profile,
          commitments: commitmentCounts[profile.id] || 0
        }))
        .filter(profile => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return profile.email.toLowerCase().includes(searchLower) ||
                 (profile.dorm && profile.dorm.toLowerCase().includes(searchLower)) ||
                 (profile.wing && profile.wing.toLowerCase().includes(searchLower));
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
      // Prepare user IDs for signup
      const userIds = Array.from(selectedUsers);
      if (includeMyself) {
        userIds.push(user.id);
      }

      // Try group signup API first, fallback to direct Supabase if not available
      let signupSuccessful = false;
      let errorMessage = "";

      try {
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? '/api/group-signup' 
          : 'http://localhost:3001/api/group-signup';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_ids: userIds,
            event_id: eventId,
            signed_up_by: user.id
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          signupSuccessful = true;
        } else {
          errorMessage = result.error || 'API signup failed';
        }
      } catch (apiError) {
        console.log("API signup failed, trying direct Supabase call:", apiError);
        
        // Fallback to direct Supabase call if API is not available
        try {
          const signupData = userIds.map(userId => ({
            user_id: userId,
            event_id: eventId,
            signed_up_by: user.id
          }));

          const { error: insertError } = await supabase
            .from('user_events')
            .insert(signupData);

          if (insertError) {
            errorMessage = insertError.message;
          } else {
            signupSuccessful = true;
          }
        } catch (supabaseError) {
          errorMessage = supabaseError.message || 'Direct signup failed';
        }
      }

      if (!signupSuccessful) {
        throw new Error(errorMessage || 'Failed to sign up users');
      }

      // Send confirmation emails (optional - won't break if it fails)
      try {
        const signupData = userIds.map(userId => ({
          userId,
          eventId,
          signedUpBy: user.id
        }));

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

      const totalSignups = userIds.length;
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
        description: error.message || "Failed to sign up users. Please try again.",
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
                  Show only users from my floor/wing
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
              <div className="p-4 text-center text-muted-foreground space-y-2">
                <div>
                  {showOnlyMyFloor ? "No users found on your floor" : "No users available for group signup"}
                </div>
                {showOnlyMyFloor && (
                  <div className="text-xs">
                    Try unchecking "Show only users from my floor" to see more users
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 p-1 sm:p-2">
                {users.map((userProfile) => {
                  const isSelected = selectedUsers.has(userProfile.id);
                  const cannotSignUp = userProfile.commitments >= 2;
                  
                  return (
                    <div
                      key={userProfile.id}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-accent/10 border-accent' 
                          : cannotSignUp
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => !cannotSignUp && handleUserToggle(userProfile.id)}
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
      userType="volunteer"
    />
    </>
  );
};

export default GroupSignupModal;
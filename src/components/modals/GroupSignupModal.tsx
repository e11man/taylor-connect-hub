import { useState, useEffect } from "react";
import { Search, Users, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const handleSubmit = async () => {
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

    setSubmitting(true);
    
    try {
      const signupPromises = [];
      
      // Sign up selected users
      for (const userId of selectedUsers) {
        signupPromises.push(
          supabase
            .from('user_events')
            .insert({
              user_id: userId,
              event_id: eventId
            })
        );
      }

      // Include myself if checked
      if (includeMyself) {
        signupPromises.push(
          supabase
            .from('user_events')
            .insert({
              user_id: user.id,
              event_id: eventId
            })
        );
      }

      const results = await Promise.all(signupPromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to sign up ${errors.length} users`);
      }

      toast({
        title: "Success!",
        description: `Successfully signed up ${totalSignups} ${totalSignups === 1 ? 'person' : 'people'} for "${eventTitle}".`,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-montserrat font-bold text-primary">
            Group Signup
          </DialogTitle>
          <p className="text-muted-foreground">
            Sign up multiple people for: <span className="font-semibold">{eventTitle}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Available spots: {availableSpots} | Selected: {totalSelected}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-6">
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
                <label htmlFor="includeMyself" className="text-sm font-medium text-blue-600">
                  Sign myself up too
                </label>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="border rounded-lg max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {showOnlyMyFloor ? "No users found on your floor" : "No users found"}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {users.map((userProfile) => {
                  const isSelected = selectedUsers.has(userProfile.user_id);
                  const cannotSignUp = userProfile.commitments >= 2;
                  
                  return (
                    <div
                      key={userProfile.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : cannotSignUp
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => !cannotSignUp && handleUserToggle(userProfile.user_id)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          disabled={cannotSignUp}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {userProfile.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userProfile.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userProfile.dorm} - {userProfile.wing}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-muted-foreground">
                          Commitments: {userProfile.commitments}/2
                        </div>
                        {cannotSignUp && (
                          <div className="text-xs text-red-500 font-medium">
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
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-muted-foreground">
              {totalSelected} {totalSelected === 1 ? 'person' : 'people'} selected
            </p>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={totalSelected === 0 || totalSelected > availableSpots || submitting}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? "Signing Up..." : `Sign Up ${totalSelected} ${totalSelected === 1 ? 'Person' : 'People'}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSignupModal;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Calendar, 
  Shield, 
  UserCheck, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  UserPlus,
  Building,
  CalendarDays,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Heart,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { Statistics } from "@/components/admin/Statistics";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";
import { formatEventTimeRange } from "@/utils/formatEvent";

type UserRole = Database["public"]["Enums"]["user_role"];

interface User {
  id: string;
  user_id?: string; // Added for user_id from profiles
  email: string;
  created_at: string;
  profiles?: {
    dorm: string | null;
    wing: string | null;
    status: string;
    profile_id?: string; // Added for profile_id
    role?: UserRole; // Added for role from profiles table
  };
  user_roles?: {
    role: UserRole;
  }[];
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  contact_email: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  location: string | null;
  max_participants: number | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  organizations?: {
    name: string;
  };
  participants?: number;
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  
  // Edit modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // Stats for dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeOrgs: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    // Don't check admin access while still loading
    if (loading) return;
    
    checkAdminAccess();
  }, [user, loading]);

  useEffect(() => {
    if (isAdmin) {
      const updateStats = () => {
        setStats({
          totalUsers: users.length,
          pendingApprovals: pendingUsers.length + pendingOrganizations.length,
          activeOrgs: organizations.length,
          upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length
        });
      };
      updateStats();
    }
  }, [users, pendingUsers, organizations, pendingOrganizations, events, isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/admin');
      return;
    }

    try {
      // Check admin role in profiles table (where our admin users are stored)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('email', user.email)
        .maybeSingle();

      // Check for specific database errors
      if (error) {
        console.error('Database error checking admin role:', error);
        
        // Check for common schema/permission errors
        if (error.message?.includes('schema') || error.code === '42501') {
          toast({
            title: "Database Configuration Error",
            description: "Unable to verify admin access. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Access Check Failed",
            description: error.message || "Could not verify your admin privileges.",
            variant: "destructive",
          });
        }
        navigate('/');
        return;
      }

      // Verify admin role and active status
      if (!profileData || profileData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (profileData.status !== 'active') {
        toast({
          title: "Account Not Active",
          description: "Your account is not active. Please contact support.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // User is admin, proceed with loading data
      setIsAdmin(true);
      await fetchAllData();
    } catch (error) {
      console.error('Unexpected error checking admin access:', error);
      
      // Fallback error handling
      toast({
        title: "System Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      navigate('/admin');
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchOrganizations(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Some data could not be loaded. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Starting fetchUsers...');
      
      // FIX: Removed supabase.auth.admin.listUsers() which requires service role key
      // Instead, we query the profiles table directly which the anon key can access
      // This prevents the "Database error querying schema" error
      
      // Fetch all profiles (users) - exclude organizations
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_type', 'organization') // Exclude organizations from users list
        .order('created_at', { ascending: false });
      
      console.log('Profiles query result:', { profiles, profilesError });
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // Fetch user roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      console.log('Roles query result:', { roles, rolesError });
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        // Don't throw here, roles might not exist for all users
      }

      // Combine the data
      const combinedUsers = (profiles || []).map(profile => {
        const role = roles?.find(r => r.user_id === profile.user_id);
        
        return {
          id: profile.id, // Use profile.id instead of profile.user_id
          user_id: profile.user_id, // Keep user_id for role management
          email: profile.email || '',
          created_at: profile.created_at,
          profiles: {
            dorm: profile.dorm,
            wing: profile.wing,
            status: profile.status || 'active',
            profile_id: profile.id, // Keep track of profile id for updates
            role: profile.role // Include role from profiles table
          },
          user_roles: role ? [{
            role: role.role as UserRole
          }] : []
        };
      });

      console.log('Combined users:', combinedUsers);

      // Separate active and pending users
      const activeUsers = combinedUsers.filter(u => 
        !u.profiles || u.profiles.status === 'active'
      );
      const pendingUsersList = combinedUsers.filter(u => 
        u.profiles?.status === 'pending'
      );

      console.log(`Found ${activeUsers.length} active users and ${pendingUsersList.length} pending users`);
      console.log('Pending users details:', pendingUsersList.map(u => ({ email: u.email, user_type: u.profiles?.user_type })));

      setUsers(activeUsers);
      setPendingUsers(pendingUsersList);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      
      // Provide user-friendly error message
      toast({
        title: "Error loading users",
        description: error instanceof Error ? error.message : "Failed to load user data. Please check your permissions.",
        variant: "destructive",
      });
      
      setUsers([]);
      setPendingUsers([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const approved = data?.filter(org => org.status === 'approved') || [];
      const pending = data?.filter(org => org.status === 'pending') || [];

      setOrganizations(approved);
      setPendingOrganizations(pending);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
      setPendingOrganizations([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizations (name),
          user_events (count)
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      // Add participant count
      const eventsWithParticipants = data?.map(event => ({
        ...event,
        participants: event.user_events?.[0]?.count || 0
      })) || [];

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "Come back soon! 👋",
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/');
    }
  };

  // User management functions
  const approveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          adminId: user?.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "User approved! 🎉",
          description: "The user can now access the platform.",
        });
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve user.",
        variant: "destructive",
      });
    }
  };

  const rejectUser = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this user?")) return;

    try {
      const response = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          adminId: user?.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "User rejected",
          description: "The user has been denied access.",
        });
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject user.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // First, get the user to check if they have a user_id
      const user = users.find(u => u.id === userId) || pendingUsers.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update profiles table first
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update or insert into user_roles table using the actual user_id
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.user_id || user.id, // Use user_id if available, fallback to id
          role: newRole 
        });

      if (roleError) throw roleError;

      toast({
        title: "Role updated! ✨",
        description: `User role changed to ${newRole}. Changes will be visible after refresh.`,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will permanently delete the user account, all their event signups, and if they're an organization, all their events and organization data. This action cannot be undone.")) return;

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          adminId: user?.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "User deleted",
          description: "The user and all related data have been permanently removed.",
        });
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  // Organization management functions
  const approveOrganization = async (orgId: string) => {
    try {
      const response = await fetch('/api/admin/approve-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: orgId,
          adminId: user?.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Organization approved! 🎊",
          description: "They can now create events and have been notified via email.",
        });
        await fetchOrganizations();
      } else {
        throw new Error(result.error || 'Failed to approve organization');
      }
    } catch (error) {
      console.error('Error approving organization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve organization.",
        variant: "destructive",
      });
    }
  };

  const rejectOrganization = async (orgId: string) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    if (reason === null) return; // User cancelled

    try {
      const response = await fetch('/api/admin/reject-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: orgId,
          adminId: user?.id,
          reason: reason || undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Organization rejected",
          description: "The organization has been denied and notified via email.",
        });
        await fetchOrganizations();
      } else {
        throw new Error(result.error || 'Failed to reject organization');
      }
    } catch (error) {
      console.error('Error rejecting organization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject organization.",
        variant: "destructive",
      });
    }
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Organization updated! 💫",
        description: "Changes saved successfully.",
      });

      await fetchOrganizations();
      setEditingOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization.",
        variant: "destructive",
      });
    }
  };

  const deleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure? This will permanently delete the organization, all its events, user signups, and the user account. This action cannot be undone.")) return;

    try {
      const response = await fetch('/api/admin/delete-organization', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: orgId,
          adminId: user?.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Organization deleted",
          description: "The organization and all related data have been permanently removed.",
        });
        await fetchOrganizations();
      } else {
        throw new Error(result.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete organization.",
        variant: "destructive",
      });
    }
  };

  // Event management functions
  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event updated! 🎯",
        description: "Changes saved successfully.",
      });

      await fetchEvents();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event.",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      // Delete related data first
      await supabase.from('user_events').delete().eq('event_id', eventId);
      await supabase.from('chat_messages').delete().eq('event_id', eventId);
      
      // Delete event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been removed.",
      });

      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const performEventCleanup = async () => {
    if (!confirm("This will remove all expired events (more than 1 hour after end time) that have no chat messages. Continue?")) return;

    setIsCleaningUp(true);
    try {
      const response = await fetch('/api/cleanup-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Event Cleanup Complete",
          description: result.message,
        });
        await fetchEvents(); // Refresh events list
      } else {
        throw new Error(result.error || 'Failed to perform cleanup');
      }
    } catch (error) {
      console.error('Error performing event cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Failed to perform event cleanup.",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.profiles?.dorm?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.profiles?.wing?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
    org.contact_email.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
    event.organizations?.name.toLowerCase().includes(eventSearchTerm.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafb] to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#00AFCE] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <Sparkles className="w-6 h-6 text-[#00AFCE] absolute top-0 right-0 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">
              {loading ? 'Checking authentication...' : 'Loading admin dashboard...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafb] to-white">
      <Header />
      
      <main className="section-padding">
        <div className="container-custom">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 mb-8 md:mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-2 flex items-center gap-2">
                  Admin Console
                  <Shield className="w-8 h-8 text-[#00AFCE]" />
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage your community with love 💙
                </p>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="group hover:border-red-500 transition-all w-full sm:w-auto"
              >
                <Shield className="w-4 h-4 mr-2 group-hover:text-red-500 transition-colors" />
                Exit Admin
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("users")}>
                <CardContent className="p-6 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("pending")}>
                <CardContent className="p-6 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("orgs")}>
                <CardContent className="p-6 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Orgs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeOrgs}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("events")}>
                <CardContent className="p-6 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Events</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Cleanup Button */}
            <div className="flex justify-center mb-6">
              <Button
                onClick={performEventCleanup}
                disabled={isCleaningUp}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                {isCleaningUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Cleaning Up...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clean Up Expired Events
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 md:space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex min-w-full sm:grid sm:w-full sm:grid-cols-6 h-auto p-1 bg-white shadow-sm">
                <TabsTrigger value="users" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <UserCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Pending</span>
                </TabsTrigger>
                <TabsTrigger value="orgs" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Orgs</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Events</span>
                </TabsTrigger>
                <TabsTrigger value="statistics" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Statistics</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3 px-4 md:px-2 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Content</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Manage active users, roles, and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full sm:w-auto">
                        <div className="relative flex-1 w-full sm:max-w-sm">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search by email, dorm, or wing..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                          />
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 whitespace-nowrap">
                          {filteredUsers.length} users
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers()}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-16 md:py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No users found</p>
                        <p className="text-gray-400 text-sm px-4">
                          {userSearchTerm ? "Try adjusting your search" : "Users will appear here once they sign up"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredUsers.map((user) => (
                          <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 w-full">
                                  <Avatar className="flex-shrink-0">
                                    <AvatarFallback className="bg-[#00AFCE] text-white">
                                      {user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{user.email}</p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                                      {user.profiles?.dorm && (
                                        <span className="flex items-center gap-1">
                                          <Building className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">{user.profiles.dorm} {user.profiles.wing && `- Wing ${user.profiles.wing}`}</span>
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                        <span className="whitespace-nowrap">Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                                      </span>
                                    </div>
                                    <Badge 
                                      variant={user.profiles?.status === 'active' ? 'default' : 
                                              user.profiles?.status === 'pending' ? 'secondary' : 'destructive'} 
                                      className="mt-2 sm:hidden"
                                    >
                                      {user.profiles?.status || 'active'}
                                    </Badge>
                                  </div>
                                  <Badge 
                                    variant={user.profiles?.status === 'active' ? 'default' : 
                                            user.profiles?.status === 'pending' ? 'secondary' : 'destructive'} 
                                    className="hidden sm:inline-flex"
                                  >
                                    {user.profiles?.status || 'active'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <Select
                                    value={user.user_roles?.[0]?.role || user.profiles?.role || 'user'}
                                    onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                                  >
                                    <SelectTrigger className="w-full sm:w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="pa">PA</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingUser(user)}
                                      className="h-9 w-9"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteUser(user.id)}
                                      className="hover:text-red-600 h-9 w-9"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Tab */}
            <TabsContent value="pending" className="space-y-6">
              <div className="space-y-8">
                {/* Pending Users */}
                <Card>
                  <CardHeader className="pb-4 md:pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                      <UserPlus className="w-5 h-5" />
                      Pending User Approvals
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Review and approve new user registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-16 md:py-12">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">All caught up!</p>
                        <p className="text-gray-400 text-sm">No pending user approvals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingUsers.map((user) => (
                          <Card key={user.id} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="w-full sm:w-auto">
                                  <p className="font-semibold text-lg">{user.email}</p>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-2">
                                    {user.profiles?.dorm && (
                                      <span className="flex items-center gap-1">
                                        <Building className="w-3 h-3 flex-shrink-0" />
                                        <span>{user.profiles.dorm} {user.profiles.wing && `- ${user.profiles.wing}`}</span>
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 flex-shrink-0" />
                                      <span className="whitespace-nowrap">Applied {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                  <Button
                                    size="sm"
                                    onClick={() => approveUser(user.id)}
                                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectUser(user.id)}
                                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 flex-1 sm:flex-initial"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Organizations */}
                <Card>
                  <CardHeader className="pb-4 md:pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                      <Building className="w-5 h-5" />
                      Pending Organization Approvals
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Review and approve new organization registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {pendingOrganizations.length === 0 ? (
                      <div className="text-center py-16 md:py-12">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">All caught up!</p>
                        <p className="text-gray-400 text-sm">No pending organization approvals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrganizations.map((org) => (
                          <Card key={org.id} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-4 sm:p-6">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{org.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                                  </div>
                                  <div className="flex gap-3 w-full sm:w-auto">
                                    <Button
                                      size="sm"
                                      onClick={() => approveOrganization(org.id)}
                                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => rejectOrganization(org.id)}
                                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 flex-1 sm:flex-initial"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{org.contact_email}</span>
                                  </div>
                                  {org.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span>{org.phone}</span>
                                    </div>
                                  )}
                                  {org.website && (
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4 text-gray-400" />
                                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Website
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="orgs" className="space-y-6">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Building2 className="w-5 h-5" />
                    Organization Management
                  </CardTitle>
                  <CardDescription className="mt-2">
                    View and manage registered organizations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search organizations..."
                          value={orgSearchTerm}
                          onChange={(e) => setOrgSearchTerm(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                      <Badge variant="secondary" className="px-3 py-1 whitespace-nowrap">
                        {filteredOrganizations.length} organizations
                      </Badge>
                    </div>

                    {filteredOrganizations.length === 0 ? (
                      <div className="text-center py-16 md:py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No organizations found</p>
                        <p className="text-gray-400 text-sm px-4">
                          {orgSearchTerm ? "Try adjusting your search" : "Approved organizations will appear here"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrganizations.map((org) => (
                          <Card key={org.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-6">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{org.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingOrg(org)}
                                      className="h-9 w-9"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteOrganization(org.id)}
                                      className="hover:text-red-600 h-9 w-9"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{org.contact_email}</span>
                                  </div>
                                  {org.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span>{org.phone}</span>
                                    </div>
                                  )}
                                  {org.website && (
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-[#00AFCE] hover:underline truncate">
                                        Website
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {org.approved_at && (
                                  <div className="text-xs text-gray-500">
                                    Approved on {format(new Date(org.approved_at), 'MMM d, yyyy')}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Calendar className="w-5 h-5" />
                    Event Management
                  </CardTitle>
                  <CardDescription className="mt-2">
                    View and manage upcoming events
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search events..."
                          value={eventSearchTerm}
                          onChange={(e) => setEventSearchTerm(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                      <Badge variant="secondary" className="px-3 py-1 whitespace-nowrap">
                        {filteredEvents.length} events
                      </Badge>
                    </div>

                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-16 md:py-12">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No events found</p>
                        <p className="text-gray-400 text-sm px-4">
                          {eventSearchTerm ? "Try adjusting your search" : "Events will appear here once created"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredEvents.map((event) => (
                          <Card key={event.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-6">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingEvent(event)}
                                      className="h-9 w-9"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteEvent(event.id)}
                                      className="hover:text-red-600 h-9 w-9"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{formatEventTimeRange(event.arrival_time, event.estimated_end_time)}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{event.organizations?.name || 'No organization'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm mt-3">
                                  <Badge variant="secondary">
                                    {event.participants || 0} / {event.max_participants || '∞'} participants
                                  </Badge>
                                  {new Date(event.date) < new Date() && (
                                    <Badge variant="destructive">Past Event</Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="space-y-6">
              <ContentManagement />
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <Statistics />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and profile details
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const dorm = formData.get('dorm') as string;
              const wing = formData.get('wing') as string;
              const status = formData.get('status') as string;
              
              try {
                // Update profile information
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({
                    dorm: dorm || null,
                    wing: wing || null,
                    status: status,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', editingUser.id);

                if (profileError) throw profileError;

                toast({
                  title: "User updated! ✨",
                  description: "Profile information has been updated successfully.",
                });

                await fetchUsers();
                setEditingUser(null);
              } catch (error) {
                console.error('Error updating user:', error);
                toast({
                  title: "Error",
                  description: "Failed to update user profile.",
                  variant: "destructive",
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                
                <div>
                  <Label>Role</Label>
                  <Select
                    value={editingUser.user_roles?.[0]?.role || editingUser.profiles?.role || 'user'}
                    onValueChange={(value: UserRole) => {
                      updateUserRole(editingUser.id, value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="pa">PA</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingUser.profiles?.status || 'active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Dorm</Label>
                  <Input 
                    name="dorm" 
                    placeholder="Enter dorm name" 
                    defaultValue={editingUser.profiles?.dorm || ''} 
                  />
                </div>

                <div>
                  <Label>Wing</Label>
                  <Input 
                    name="wing" 
                    placeholder="Enter wing name" 
                    defaultValue={editingUser.profiles?.wing || ''} 
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {format(new Date(editingUser.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization information
            </DialogDescription>
          </DialogHeader>
          {editingOrg && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateOrganization(editingOrg.id, {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                contact_email: formData.get('contact_email') as string,
                phone: formData.get('phone') as string,
                website: formData.get('website') as string,
              });
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" name="name" defaultValue={editingOrg.name} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingOrg.description || ''} />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" name="contact_email" type="email" defaultValue={editingOrg.contact_email} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingOrg.phone || ''} />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" defaultValue={editingOrg.website || ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingOrg(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event information
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateEvent(editingEvent.id, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                date: formData.get('date') as string,
                arrival_time: formData.get('arrival_time') as string || null,
                estimated_end_time: formData.get('estimated_end_time') as string || null,
                location: formData.get('location') as string,
                max_participants: parseInt(formData.get('max_participants') as string) || null,
              });
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" defaultValue={editingEvent.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingEvent.description || ''} />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="datetime-local" defaultValue={editingEvent.date} required />
              </div>
              <div>
                <Label htmlFor="arrival_time">Arrival Time</Label>
                <Input id="arrival_time" name="arrival_time" type="datetime-local" defaultValue={editingEvent.arrival_time || ''} />
              </div>
              <div>
                <Label htmlFor="estimated_end_time">Estimated End Time</Label>
                <Input id="estimated_end_time" name="estimated_end_time" type="datetime-local" defaultValue={editingEvent.estimated_end_time || ''} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={editingEvent.location || ''} />
              </div>
              <div>
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input id="max_participants" name="max_participants" type="number" defaultValue={editingEvent.max_participants || ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;

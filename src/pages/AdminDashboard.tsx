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
  Heart
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
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles?: {
    dorm: string | null;
    wing: string | null;
    status: string;
    profile_id?: string; // Added for profile_id
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
  const { user } = useAuth();
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
  
  // Stats for dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeOrgs: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

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
      // FIX: Add proper error handling for database queries
      // Wrap in try-catch to handle schema access errors gracefully
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

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

      // Verify admin role
      if (!roleData || roleData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
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
      
      // Fetch all profiles (users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
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
          id: profile.user_id,
          email: profile.email || '',
          created_at: profile.created_at,
          profiles: {
            dorm: profile.dorm,
            wing: profile.wing,
            status: profile.status || 'active',
            profile_id: profile.id // Keep track of profile id for updates
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
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User approved! 🎉",
        description: "The user can now access the platform.",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user.",
        variant: "destructive",
      });
    }
  };

  const rejectUser = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this user?")) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User rejected",
        description: "The user has been denied access.",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole 
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Role updated! ✨",
        description: `User role changed to ${newRole}.`,
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
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      // FIX: Cannot use supabase.auth.admin.deleteUser() with anon key
      // Instead, we'll mark the user as deleted in our tables
      // Actual auth user deletion should be done via a server-side API route
      
      // Start a transaction-like operation
      const errors: string[] = [];
      
      // Delete user's role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) errors.push(`Roles: ${roleError.message}`);
      
      // Delete user's events participation
      const { error: eventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', userId);
      
      if (eventsError) errors.push(`Events: ${eventsError.message}`);
      
      // Mark user profile as deleted (soft delete)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'deleted' })
        .eq('user_id', userId);
      
      if (profileError) errors.push(`Profile: ${profileError.message}`);
      
      // If there were errors, show them
      if (errors.length > 0) {
        throw new Error(`Failed to fully delete user:\n${errors.join('\n')}`);
      }

      toast({
        title: "User marked as deleted",
        description: "User has been removed from the system. Contact support to fully delete the auth account.",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Check your permissions.",
        variant: "destructive",
      });
    }
  };

  // Organization management functions
  const approveOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Organization approved! 🎊",
        description: "They can now create events.",
      });

      await fetchOrganizations();
    } catch (error) {
      console.error('Error approving organization:', error);
      toast({
        title: "Error",
        description: "Failed to approve organization.",
        variant: "destructive",
      });
    }
  };

  const rejectOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to reject this organization?")) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'rejected' })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Organization rejected",
        description: "The organization has been denied.",
      });

      await fetchOrganizations();
    } catch (error) {
      console.error('Error rejecting organization:', error);
      toast({
        title: "Error",
        description: "Failed to reject organization.",
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
    if (!confirm("Are you sure? This will also delete all events by this organization.")) return;

    try {
      // Delete related events first
      await supabase.from('events').delete().eq('organization_id', orgId);
      
      // Delete organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Organization deleted",
        description: "The organization and its events have been removed.",
      });

      await fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafb] to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#00AFCE] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <Sparkles className="w-6 h-6 text-[#00AFCE] absolute top-0 right-0 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse">Loading admin dashboard...</p>
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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
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
                className="group hover:border-red-500 transition-all"
              >
                <Shield className="w-4 h-4 mr-2 group-hover:text-red-500 transition-colors" />
                Exit Admin
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("users")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("pending")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("orgs")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Orgs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeOrgs}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("events")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Events</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-[#00AFCE]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-white shadow-sm">
              <TabsTrigger value="users" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3">
                <UserCheck className="w-4 h-4 mr-2" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="orgs" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3">
                <Building2 className="w-4 h-4 mr-2" />
                Orgs
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3">
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-[#00AFCE] data-[state=active]:text-white py-3">
                <Sparkles className="w-4 h-4 mr-2" />
                Content
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage active users, roles, and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center justify-between">
                      <div className="flex gap-2 items-center flex-1">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search by email, dorm, or wing..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Badge variant="secondary" className="px-3 py-1">
                          {filteredUsers.length} users
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers()}
                        className="gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No users found</p>
                        <p className="text-gray-400 text-sm">
                          {userSearchTerm ? "Try adjusting your search" : "Users will appear here once they sign up"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredUsers.map((user) => (
                          <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <Avatar>
                                    <AvatarFallback className="bg-[#00AFCE] text-white">
                                      {user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-semibold">{user.email}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      {user.profiles?.dorm && (
                                        <span className="flex items-center gap-1">
                                          <Building className="w-3 h-3" />
                                          {user.profiles.dorm} {user.profiles.wing && `- Wing ${user.profiles.wing}`}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                                      </span>
                                      <Badge 
                                        variant={user.profiles?.status === 'active' ? 'default' : 
                                                user.profiles?.status === 'pending' ? 'secondary' : 'destructive'} 
                                        className="ml-2"
                                      >
                                        {user.profiles?.status || 'active'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={user.user_roles?.[0]?.role || 'user'}
                                    onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="pa">PA</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingUser(user)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteUser(user.id)}
                                    className="hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
              <div className="space-y-6">
                {/* Pending Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Pending User Approvals
                    </CardTitle>
                    <CardDescription>
                      Review and approve new user registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">All caught up!</p>
                        <p className="text-gray-400 text-sm">No pending user approvals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingUsers.map((user) => (
                          <Card key={user.id} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{user.email}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    {user.profiles?.dorm && (
                                      <span className="flex items-center gap-1">
                                        <Building className="w-3 h-3" />
                                        {user.profiles.dorm} {user.profiles.wing && `- ${user.profiles.wing}`}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Applied {format(new Date(user.created_at), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approveUser(user.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectUser(user.id)}
                                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Pending Organization Approvals
                    </CardTitle>
                    <CardDescription>
                      Review and approve new organization registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingOrganizations.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">All caught up!</p>
                        <p className="text-gray-400 text-sm">No pending organization approvals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrganizations.map((org) => (
                          <Card key={org.id} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold text-lg">{org.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => approveOrganization(org.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => rejectOrganization(org.id)}
                                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{org.contact_email}</span>
                                  </div>
                                  {org.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Organization Management
                  </CardTitle>
                  <CardDescription>
                    View and manage registered organizations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search organizations..."
                          value={orgSearchTerm}
                          onChange={(e) => setOrgSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Badge variant="secondary" className="px-3 py-1">
                        {filteredOrganizations.length} organizations
                      </Badge>
                    </div>

                    {filteredOrganizations.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No organizations found</p>
                        <p className="text-gray-400 text-sm">
                          {orgSearchTerm ? "Try adjusting your search" : "Approved organizations will appear here"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrganizations.map((org) => (
                          <Card key={org.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{org.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingOrg(org)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteOrganization(org.id)}
                                      className="hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{org.contact_email}</span>
                                  </div>
                                  {org.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Management
                  </CardTitle>
                  <CardDescription>
                    View and manage upcoming events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search events..."
                          value={eventSearchTerm}
                          onChange={(e) => setEventSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Badge variant="secondary" className="px-3 py-1">
                        {filteredEvents.length} events
                      </Badge>
                    </div>

                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No events found</p>
                        <p className="text-gray-400 text-sm">
                          {eventSearchTerm ? "Try adjusting your search" : "Events will appear here once created"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredEvents.map((event) => (
                          <Card key={event.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingEvent(event)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteEvent(event.id)}
                                      className="hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-400" />
                                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span>{event.organizations?.name || 'No organization'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
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
                    value={editingUser.user_roles?.[0]?.role || 'user'}
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, Calendar, Shield, UserCheck, UserX, Check, X, Edit, Trash2, MessageCircle, MapPin } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventChatModal } from "@/components/chat/EventChatModal";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    dorm: string;
    wing: string;
    status: string;
  };
  user_roles: {
    role: string;
  }[];
  event_count?: number;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  phone: string;
  contact_email: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  organization_id: string;
  organizations: {
    name: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    max_participants: ''
  });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState({
    email: '',
    dorm: '',
    wing: '',
    role: 'user' as 'admin' | 'pa' | 'user'
  });
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrg, setEditOrg] = useState({
    name: '',
    contact_email: '',
    website: '',
    phone: '',
    description: ''
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    // Check for demo admin authentication
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAdmin(true);
      fetchAllData(); // Fix: Call fetchAllData for demo authentication
      return;
    }

    if (!user) {
      navigate('/admin');
      return;
    }

    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !roleData || roleData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchAllData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admin');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage demo auth
      localStorage.removeItem('admin_authenticated');
      
      // Sign out from Supabase if user is authenticated
      if (user) {
        await supabase.auth.signOut();
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      navigate('/admin');
    } catch (error) {
      console.error('Error logging out:', error);
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        // If admin.listUsers fails (likely due to RLS), fallback to just getting profiles
        console.warn('Admin listUsers failed, using fallback method:', error.message);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, dorm, wing, status');

        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (profilesError) throw profilesError;
        if (rolesError) throw rolesError;

        const enrichedUsers = profilesData?.map(profile => {
          const roles = rolesData?.filter(r => r.user_id === profile.user_id) || [];
          
          return {
            id: profile.user_id,
            email: profile.email || '',
            created_at: new Date().toISOString(),
            profiles: {
              dorm: profile.dorm || '',
              wing: profile.wing || '',
              status: profile.status || 'active'
            },
            user_roles: roles.map(r => ({ role: r.role }))
          };
        }) || [];

        setUsers(enrichedUsers.filter(user => user.profiles.status === 'active'));
        setPendingUsers(enrichedUsers.filter(user => user.profiles.status === 'pending'));
        return;
      }

      const userIds = data.users.map(u => u.id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, dorm, wing, status')
        .in('user_id', userIds);

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const enrichedUsers = data.users.map(authUser => {
        const profile = profilesData?.find(p => p.user_id === authUser.id);
        const roles = rolesData?.filter(r => r.user_id === authUser.id) || [];
        
        return {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          profiles: {
            dorm: profile?.dorm || '',
            wing: profile?.wing || '',
            status: profile?.status || 'active'
          },
          user_roles: roles.map(r => ({ role: r.role }))
        };
      }).filter(user => user.profiles);

      setUsers(enrichedUsers.filter(user => user.profiles.status === 'active'));
      setPendingUsers(enrichedUsers.filter(user => user.profiles.status === 'pending'));
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty arrays as fallback
      setUsers([]);
      setPendingUsers([]);
    }
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    setOrganizations(data?.filter(org => org.status === 'approved') || []);
    setPendingOrganizations(data?.filter(org => org.status === 'pending') || []);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations (name)
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    setEvents(data || []);
  };

  const handleUserRoleChange = async (userId: string, newRole: 'admin' | 'pa' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUserStatusChange = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${status === 'active' ? 'approved' : 'blocked'}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOrganizationApproval = async (orgId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization ${status}`,
      });

      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          title: editEvent.title,
          description: editEvent.description,
          date: editEvent.date,
          location: editEvent.location,
          max_participants: parseInt(editEvent.max_participants) || null,
        })
        .eq('id', editingEvent.id)
        .select(`
          *,
          organizations (name)
        `)
        .single();

      if (error) throw error;

      setEvents(events.map(event => event.id === editingEvent.id ? data : event));
      setIsEditModalOpen(false);
      setEditingEvent(null);
      setEditEvent({ title: '', description: '', date: '', location: '', max_participants: '' });
      
      toast({
        title: "Success!",
        description: "Event updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This will also remove all volunteer signups and cannot be undone.`)) {
      return;
    }

    try {
      // First delete all user_events (signups) for this event
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('event_id', eventId);

      if (userEventsError) throw userEventsError;

      // Then delete all chat messages for this event
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('event_id', eventId);

      if (chatError) throw chatError;

      // Finally delete the event itself
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) throw eventError;

      setEvents(events.filter(event => event.id !== eventId));
      
      toast({
        title: "Success!",
        description: "Event and all related data deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description || '',
      date: event.date.split('T')[0] + 'T' + event.date.split('T')[1]?.substring(0, 5) || '', // Format for datetime-local
      location: event.location || '',
      max_participants: event.max_participants?.toString() || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: editUser.email,
          dorm: editUser.dorm,
          wing: editUser.wing,
        })
        .eq('user_id', editingUser.id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: editUser.role })
        .eq('user_id', editingUser.id);

      if (roleError) throw roleError;

      setIsEditUserModalOpen(false);
      setEditingUser(null);
      setEditUser({ email: '', dorm: '', wing: '', role: 'user' });
      
      toast({
        title: "Success!",
        description: "User updated successfully.",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This will remove all their data and cannot be undone.`)) {
      return;
    }

    try {
      // Delete user's events signups
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', userId);

      if (userEventsError) throw userEventsError;

      // Delete user's chat messages
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (chatError) throw chatError;

      // Delete user roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) console.warn('Auth deletion failed:', authError.message);

      toast({
        title: "Success!",
        description: "User deleted successfully.",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setEditUser({
      email: user.email,
      dorm: user.profiles.dorm,
      wing: user.profiles.wing,
      role: user.user_roles[0]?.role as 'admin' | 'pa' | 'user' || 'user'
    });
    setIsEditUserModalOpen(true);
  };

  const handleEditOrganization = async () => {
    if (!editingOrg) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editOrg.name,
          contact_email: editOrg.contact_email,
          website: editOrg.website,
          phone: editOrg.phone,
          description: editOrg.description,
        })
        .eq('id', editingOrg.id);

      if (error) throw error;

      setIsEditOrgModalOpen(false);
      setEditingOrg(null);
      setEditOrg({ name: '', contact_email: '', website: '', phone: '', description: '' });
      
      toast({
        title: "Success!",
        description: "Organization updated successfully.",
      });
      
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete organization "${orgName}"? This will also delete all their events and cannot be undone.`)) {
      return;
    }

    try {
      // First get all events for this organization
      const { data: orgEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', orgId);

      if (eventsError) throw eventsError;

      // Delete all user signups for these events
      if (orgEvents && orgEvents.length > 0) {
        const eventIds = orgEvents.map(e => e.id);
        
        const { error: userEventsError } = await supabase
          .from('user_events')
          .delete()
          .in('event_id', eventIds);

        if (userEventsError) throw userEventsError;

        // Delete all chat messages for these events
        const { error: chatError } = await supabase
          .from('chat_messages')
          .delete()
          .in('event_id', eventIds);

        if (chatError) throw chatError;
      }

      // Delete all events for this organization
      const { error: eventsDeleteError } = await supabase
        .from('events')
        .delete()
        .eq('organization_id', orgId);

      if (eventsDeleteError) throw eventsDeleteError;

      // Finally delete the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (orgError) throw orgError;

      toast({
        title: "Success!",
        description: "Organization and all related data deleted successfully.",
      });
      
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization.",
        variant: "destructive",
      });
    }
  };

  const openEditOrgModal = (org: Organization) => {
    setEditingOrg(org);
    setEditOrg({
      name: org.name,
      contact_email: org.contact_email,
      website: org.website || '',
      phone: org.phone || '',
      description: org.description || ''
    });
    setIsEditOrgModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profiles.dorm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingUsers = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="section-padding">
          <div className="container-custom">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#00AFCE] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="section-padding">
        <div className="container-custom">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-montserrat font-bold text-primary mb-1 md:mb-2">
                Admin Console
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground font-montserrat">
                Manage users, organizations, and opportunities
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 self-end sm:self-auto"
              size="sm"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="users" className="flex items-center gap-1 text-xs lg:text-sm">
                <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Users ({users.length})</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="pending-users" className="flex items-center gap-1 text-xs lg:text-sm">
                <UserCheck className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Pending ({pendingUsers.length})</span>
                <span className="sm:hidden">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-1 text-xs lg:text-sm">
                <Building2 className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Organizations ({organizations.length})</span>
                <span className="sm:hidden">Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="pending-orgs" className="flex items-center gap-1 text-xs lg:text-sm">
                <Building2 className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">Pending Orgs ({pendingOrganizations.length})</span>
                <span className="lg:hidden">P. Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="flex items-center gap-1 text-xs lg:text-sm">
                <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Opportunities ({events.length})</span>
                <span className="sm:hidden">Events</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs lg:text-sm">
                <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage active users, roles, and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search users by email or dorm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Dorm</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.profiles.dorm} - {user.profiles.wing}</TableCell>
                              <TableCell>
                                <Badge variant={user.user_roles[0]?.role === 'admin' ? 'destructive' : 'secondary'}>
                                  {user.user_roles[0]?.role || 'user'}
                                </Badge>
                              </TableCell>
                              <TableCell className="space-x-2">
                                <Select
                                  value={user.user_roles[0]?.role || 'user'}
                                  onValueChange={(value: 'admin' | 'pa' | 'user') => handleUserRoleChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="pa">PA</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditUserModal(user)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetUserPassword(user.id, user.email)}
                                >
                                  Reset Password
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg">{user.email}</h3>
                              <p className="text-sm text-muted-foreground">{user.profiles.dorm} - {user.profiles.wing}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Role:</span>
                              <Badge variant={user.user_roles[0]?.role === 'admin' ? 'destructive' : 'secondary'}>
                                {user.user_roles[0]?.role || 'user'}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <Select
                                value={user.user_roles[0]?.role || 'user'}
                                onValueChange={(value: 'admin' | 'pa' | 'user') => handleUserRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Change Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="pa">PA</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditUserModal(user)}
                                  className="w-full justify-start"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetUserPassword(user.id, user.email)}
                                  className="w-full justify-start text-xs"
                                >
                                  Reset Password
                                </Button>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="w-full justify-start"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Users Tab */}
            <TabsContent value="pending-users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Users</CardTitle>
                  <CardDescription>Users who registered without a @taylor.edu email</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleUserStatusChange(user.id, 'active')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUserStatusChange(user.id, 'blocked')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredPendingUsers.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{user.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              Registered: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUserStatusChange(user.id, 'active')}
                              className="bg-green-600 hover:bg-green-700 flex-1 justify-start"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserStatusChange(user.id, 'blocked')}
                              className="flex-1 justify-start"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="organizations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>Manage approved organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizations.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>{org.contact_email}</TableCell>
                            <TableCell>{org.website || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditOrgModal(org)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrganization(org.id, org.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {organizations.map((org) => (
                      <Card key={org.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">{org.contact_email}</p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Website:</span>
                              <span className="text-muted-foreground ml-2">{org.website || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Status:</span>
                              <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEditOrgModal(org)}
                              className="flex-1 justify-start"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteOrganization(org.id, org.name)}
                              className="flex-1 justify-start"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Organizations Tab */}
            <TabsContent value="pending-orgs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Organizations</CardTitle>
                  <CardDescription>Organizations awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingOrganizations.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>{org.contact_email}</TableCell>
                            <TableCell className="max-w-xs truncate">{org.description}</TableCell>
                            <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleOrganizationApproval(org.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOrganizationApproval(org.id, 'rejected')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {pendingOrganizations.map((org) => (
                      <Card key={org.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">{org.contact_email}</p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="text-muted-foreground mt-1">{org.description}</p>
                            </div>
                            <div>
                              <span className="font-medium">Registration Date:</span>
                              <span className="text-muted-foreground ml-2">{new Date(org.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOrganizationApproval(org.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 flex-1 justify-start"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOrganizationApproval(org.id, 'rejected')}
                              className="flex-1 justify-start"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Opportunities Management</CardTitle>
                  <CardDescription>Manage all volunteer opportunities and their chats</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{event.organizations?.name}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>{event.location}</TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setChatModalOpen(true);
                                }}
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                View Chat
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditModal(event)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {events.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">{event.organizations?.name}</p>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{event.location}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event);
                                setChatModalOpen(true);
                              }}
                              className="w-full justify-start"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              View Chat
                            </Button>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditModal(event)}
                                className="flex-1 justify-start"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                className="flex-1 justify-start"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Settings</CardTitle>
                  <CardDescription>System configuration and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Email Domain Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Currently, only @taylor.edu emails are auto-approved. Other domains require manual approval.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Organization Approval</h3>
                      <p className="text-sm text-muted-foreground">
                        All new organizations require admin approval before they can access their dashboard.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
            <DialogDescription>
              Update the details for this volunteer opportunity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title*</Label>
              <Input
                id="edit-title"
                value={editEvent.title}
                onChange={(e) => setEditEvent({...editEvent, title: e.target.value})}
                placeholder="Opportunity Title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description*</Label>
              <Textarea
                id="edit-description"
                value={editEvent.description}
                onChange={(e) => setEditEvent({...editEvent, description: e.target.value})}
                placeholder="Describe the opportunity"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Date*</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={editEvent.date}
                onChange={(e) => setEditEvent({...editEvent, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editEvent.location}
                onChange={(e) => setEditEvent({...editEvent, location: e.target.value})}
                placeholder="Event location"
              />
            </div>
            <div>
              <Label htmlFor="edit-max_participants">Max Volunteers</Label>
              <Input
                id="edit-max_participants"
                type="number"
                value={editEvent.max_participants}
                onChange={(e) => setEditEvent({...editEvent, max_participants: e.target.value})}
                placeholder="Maximum number of volunteers"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <PrimaryButton 
                onClick={handleEditEvent}
                disabled={!editEvent.title || !editEvent.description || !editEvent.date}
                className="flex-1"
              >
                Update Opportunity
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-user-email">Email*</Label>
              <Input
                id="edit-user-email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-dorm">Dorm*</Label>
              <Input
                id="edit-user-dorm"
                value={editUser.dorm}
                onChange={(e) => setEditUser({...editUser, dorm: e.target.value})}
                placeholder="Dorm name"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-wing">Wing*</Label>
              <Input
                id="edit-user-wing"
                value={editUser.wing}
                onChange={(e) => setEditUser({...editUser, wing: e.target.value})}
                placeholder="Wing"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">Role*</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: 'admin' | 'pa' | 'user') => setEditUser({...editUser, role: value})}
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
            <div className="flex gap-2 pt-4">
              <PrimaryButton 
                onClick={handleEditUser}
                disabled={!editUser.email || !editUser.dorm || !editUser.wing}
                className="flex-1"
              >
                Update User
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={isEditOrgModalOpen} onOpenChange={setIsEditOrgModalOpen}>
        <DialogContent className="sm:max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-org-name">Organization Name*</Label>
              <Input
                id="edit-org-name"
                value={editOrg.name}
                onChange={(e) => setEditOrg({...editOrg, name: e.target.value})}
                placeholder="Organization name"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-email">Contact Email*</Label>
              <Input
                id="edit-org-email"
                type="email"
                value={editOrg.contact_email}
                onChange={(e) => setEditOrg({...editOrg, contact_email: e.target.value})}
                placeholder="contact@organization.org"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-phone">Phone</Label>
              <Input
                id="edit-org-phone"
                value={editOrg.phone}
                onChange={(e) => setEditOrg({...editOrg, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-website">Website</Label>
              <Input
                id="edit-org-website"
                value={editOrg.website}
                onChange={(e) => setEditOrg({...editOrg, website: e.target.value})}
                placeholder="https://website.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-description">Description*</Label>
              <Textarea
                id="edit-org-description"
                value={editOrg.description}
                onChange={(e) => setEditOrg({...editOrg, description: e.target.value})}
                placeholder="Organization description"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <PrimaryButton 
                onClick={handleEditOrganization}
                disabled={!editOrg.name || !editOrg.contact_email || !editOrg.description}
                className="flex-1"
              >
                Update Organization
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsEditOrgModalOpen(false)}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, Calendar, Shield, UserCheck, UserX, Check, X, Edit, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventChatModal } from "@/components/chat/EventChatModal";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
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
      navigate('/');
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
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;

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
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-2">
              Admin Console
            </h1>
            <p className="text-lg text-muted-foreground font-montserrat">
              Manage users, organizations, and opportunities
            </p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="pending-users" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Pending ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organizations ({organizations.length})
              </TabsTrigger>
              <TabsTrigger value="pending-orgs" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Pending Orgs ({pendingOrganizations.length})
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Opportunities ({events.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Settings
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
                                onClick={() => resetUserPassword(user.id, user.email)}
                              >
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUserStatusChange(user.id, 'blocked')}
                              >
                                Block
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOrganizationApproval(org.id, 'rejected')}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
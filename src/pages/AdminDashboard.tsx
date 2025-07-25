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
import { dormAndFloorData } from "@/utils/dormData";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    dorm: string;
    wing: string;
    status: string;
    role?: string;
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
  website: string | null;
  phone: string | null;
  contact_email: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  organization_id: string | null;
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
      await supabase.auth.signOut();
      
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
      console.log('=== Fetching Users ===');
      
      // Fetch both profiles and user_roles separately for better reliability
      console.log('Fetching profiles data...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, dorm, wing, status, created_at');
      
      console.log('Fetching user roles data...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (profilesError) {
        console.error('Profiles query failed:', profilesError);
        throw profilesError;
      }

      if (rolesError) {
        console.warn('User roles query failed, will use default role:', rolesError);
      }

      console.log(`Found ${profilesData?.length || 0} profiles and ${rolesData?.length || 0} role records`);

      const enrichedUsers = profilesData?.map(profile => {
        // Normalize status - treat null, undefined, empty string, or 'NULL' as 'active'
        let normalizedStatus = profile.status;
        if (!normalizedStatus || normalizedStatus === '' || normalizedStatus === 'NULL' || normalizedStatus === 'null') {
          normalizedStatus = 'active';
        }
        
        // Get role from user_roles lookup
        let userRole = 'user';
        if (rolesData) {
          const roleRecord = rolesData.find(r => r.user_id === profile.user_id);
          userRole = roleRecord?.role || 'user';
        }
        
        return {
          id: profile.user_id,
          email: profile.email || '',
          created_at: profile.created_at || new Date().toISOString(),
          profiles: {
            dorm: profile.dorm || '',
            wing: profile.wing || '',
            status: normalizedStatus,
            role: userRole
          },
          user_roles: [{ role: userRole }]
        };
      }) || [];

      // Filter users by status
      const activeUsers = enrichedUsers.filter(user => {
        const status = user.profiles.status;
        return status === 'active' || 
               !status || 
               status === '' ||
               status === 'NULL' ||
               status === 'null';
      });
      
      const pendingUsers = enrichedUsers.filter(user => user.profiles.status === 'pending');

      console.log(`Processed ${activeUsers.length} active users and ${pendingUsers.length} pending users`);
      
      setUsers(activeUsers);
      setPendingUsers(pendingUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setPendingUsers([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      console.log('=== Fetching Organizations ===');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Organizations query failed:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} total organizations`);
      
      if (data) {
        data.forEach(org => {
          console.log(`Organization: ${org.name} - Status: ${org.status}`);
        });
      }

      // Filter organizations by status with better normalization
      const approvedOrgs = data?.filter(org => {
        const status = org.status;
        return status === 'approved' || 
               (!status || status === '' || status === 'NULL' || status === 'null');
      }) || [];
      
      const pendingOrgs = data?.filter(org => org.status === 'pending') || [];
      
      console.log(`Processed ${approvedOrgs.length} approved organizations and ${pendingOrgs.length} pending organizations`);
      
      setOrganizations(approvedOrgs);
      setPendingOrganizations(pendingOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
      setPendingOrganizations([]);
    }
  };

  const fetchEvents = async () => {
    try {
      console.log('=== Fetching Events ===');
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizations (name)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Events query failed:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} total events`);
      
      if (data) {
        data.forEach(event => {
          console.log(`Event: ${event.title} - Organization: ${event.organizations?.name || 'No Organization'} - Date: ${event.date}`);
        });
      }
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: 'admin' | 'pa' | 'user') => {
    try {
      console.log(`=== ROLE UPDATE DEBUG ===`);
      console.log(`Attempting to update user ${userId} role to ${newRole}`);
      console.log(`Current user (admin):`, user?.id);
      
      // Validate inputs
      if (!userId || !newRole) {
        throw new Error('User ID and role are required');
      }
      
      if (!['admin', 'pa', 'user'].includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      // Check if user exists in profiles table first
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('user_id', userId)
        .single();

      if (profileCheckError || !userProfile) {
        throw new Error('User profile not found');
      }

      console.log('User profile found:', userProfile.email);

      // Update the user_roles table with upsert to handle both updates and inserts
      const { error: roleUpdateError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role: newRole },
          { onConflict: 'user_id' }
        );

      if (roleUpdateError) {
        console.error('Role update failed:', roleUpdateError);
        throw new Error(`Failed to update role: ${roleUpdateError.message}`);
      }

      console.log(`✓ Successfully updated user ${userId} role to ${newRole}`);

      // Update local state to reflect the changes
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? {
                ...u,
                profiles: { ...u.profiles, role: newRole },
                user_roles: [{ role: newRole }]
              }
            : u
        )
      );

      setPendingUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? {
                ...u,
                profiles: { ...u.profiles, role: newRole },
                user_roles: [{ role: newRole }]
              }
            : u
        )
      );

      toast({
        title: "Success!",
        description: `User role updated to ${newRole}`,
      });

    } catch (error: any) {
      console.error('Role change error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to reset the password for "${userEmail}"? This will set their password to a temporary value.`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: 'TempPassword123!'
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Password reset for ${userEmail}. New temporary password: TempPassword123!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password.",
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
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-montserrat font-bold text-primary mb-1 md:mb-2">
                Admin Console
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground font-montserrat">
                Manage users, organizations, and opportunities
              </p>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
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
                                <Badge variant={user.profiles.role === 'admin' ? 'destructive' : 'secondary'}>
                                  {user.profiles.role || 'user'}
                                </Badge>
                              </TableCell>
                              <TableCell className="space-x-2">
                                <Select
                                  value={user.profiles.role || 'user'}
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
                              <Badge variant={user.profiles.role === 'admin' ? 'destructive' : 'secondary'}>
                                {user.profiles.role || 'user'}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <Select
                                value={user.profiles.role || 'user'}
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
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetUserPassword(user.id, user.email)}
                                className="w-full"
                              >
                                Reset Password
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found matching your search.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Simple message for other tabs - user can implement these as needed */}
            <TabsContent value="pending-users">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Users</CardTitle>
                  <CardDescription>Users awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Pending users functionality - implement as needed</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organizations">
              <Card>
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>Manage approved organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Organizations management - implement as needed</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending-orgs">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Organizations</CardTitle>
                  <CardDescription>Organizations awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Pending organizations - implement as needed</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities">
              <Card>
                <CardHeader>
                  <CardTitle>Opportunities</CardTitle>
                  <CardDescription>Manage volunteer opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Events management - implement as needed</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;

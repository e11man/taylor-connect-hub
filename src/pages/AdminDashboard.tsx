import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, BarChart3, FileText, Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Download, Upload, Building2, CheckCircle, XCircle, X, Calendar, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { Statistics } from '@/components/admin/Statistics';
import { useTimePeriodStatistics } from '@/hooks/useTimePeriodStatistics';

interface User {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  status: string;
  role: string;
  organization_name?: string;
}

interface Organization {
  id: string;
  name: string;
  contact_email: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  description?: string;
  website?: string;
  phone?: string;
}

interface Event {
  id: string;
  title: string;
  organization_name: string;
  date: string;
  description?: string;
  location?: string;
  max_participants?: number;
  created_at: string;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedOrganizations, setSelectedOrganizations] = useState<Set<string>>(new Set());
  const [emailFilter, setEmailFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();
  
  // Time period statistics
  const { 
    timePeriodStats, 
    currentYearStats, 
    currentMonthStats, 
    loading: timeStatsLoading, 
    refreshStatistics: refreshTimeStats 
  } = useTimePeriodStatistics(timePeriod);

  // Modal states
  const [viewUserModal, setViewUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [viewOrgModal, setViewOrgModal] = useState(false);
  const [editOrgModal, setEditOrgModal] = useState(false);
  const [viewEventModal, setViewEventModal] = useState(false);
  const [editEventModal, setEditEventModal] = useState(false);
  
  // Selected items for modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Edit form states
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    role: '',
    status: ''
  });
  const [editOrgForm, setEditOrgForm] = useState({
    name: '',
    contact_email: '',
    description: '',
    website: '',
    phone: ''
  });
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    max_participants: 0
  });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load users/profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load data',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate statistics
  const userStats = {
    total: users.length,
    approved: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    pas: users.filter(u => u.role === 'pa').length,
    organizations: organizations.length,
  };

  const orgStats = {
    total: organizations.length,
    approved: organizations.filter(o => o.status === 'approved').length,
    pending: organizations.filter(o => o.status === 'pending').length,
    rejected: organizations.filter(o => o.status === 'rejected').length,
  };

  const eventStats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.date) > new Date()).length,
    past: events.filter(e => new Date(e.date) <= new Date()).length,
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.organization_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = emailFilter === 'all' || user.user_type === emailFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = orgFilter === 'all' || org.status === orgFilter;
    return matchesSearch && matchesFilter;
  });

  // User selection functions
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const clearUserSelection = () => {
    setSelectedUsers(new Set());
  };

  const selectAllPAs = () => {
    const paUsers = filteredUsers.filter(u => u.role === 'pa');
    setSelectedUsers(new Set(paUsers.map(u => u.id)));
  };

  // Organization selection functions
  const toggleOrganizationSelection = (orgId: string) => {
    const newSelection = new Set(selectedOrganizations);
    if (newSelection.has(orgId)) {
      newSelection.delete(orgId);
    } else {
      newSelection.add(orgId);
    }
    setSelectedOrganizations(newSelection);
  };

  const selectAllOrganizations = () => {
    setSelectedOrganizations(new Set(filteredOrganizations.map(o => o.id)));
  };

  const clearOrganizationSelection = () => {
    setSelectedOrganizations(new Set());
  };

  // Approval functions
  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User approved successfully",
      });

      loadData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to approve user',
        variant: "destructive",
      });
    }
  };

  const approveOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization approved successfully",
      });

      loadData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to approve organization',
        variant: "destructive",
      });
    }
  };

  const rejectOrganization = async (orgId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization rejected successfully",
      });

      loadData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to reject organization',
        variant: "destructive",
      });
    }
  };

  const promoteToPA = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'pa' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User promoted to PA successfully",
      });

      loadData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to promote user',
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      loadData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete event',
        variant: "destructive",
      });
    }
  };

  // View functions
  const viewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserModal(true);
  };

  const viewOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setViewOrgModal(true);
  };

  const viewEvent = (event: Event) => {
    setSelectedEvent(event);
    setViewEventModal(true);
  };

  // Edit functions
  const editUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditUserModal(true);
  };

  const editOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setEditOrgForm({
      name: org.name,
      contact_email: org.contact_email,
      description: org.description || '',
      website: org.website || '',
      phone: org.phone || ''
    });
    setEditOrgModal(true);
  };

  const editEvent = (event: Event) => {
    setSelectedEvent(event);
    setEditEventForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      location: event.location || '',
      max_participants: event.max_participants || 0
    });
    setEditEventModal(true);
  };

  // Save functions
  const saveUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: editUserForm.email,
          role: editUserForm.role,
          status: editUserForm.status
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditUserModal(false);
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update user',
        variant: "destructive",
      });
    }
  };

  const saveOrganization = async () => {
    if (!selectedOrg) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editOrgForm.name,
          contact_email: editOrgForm.contact_email,
          description: editOrgForm.description,
          website: editOrgForm.website,
          phone: editOrgForm.phone
        })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization updated successfully",
      });

      setEditOrgModal(false);
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update organization',
        variant: "destructive",
      });
    }
  };

  const saveEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editEventForm.title,
          description: editEventForm.description,
          date: editEventForm.date,
          location: editEventForm.location,
          max_participants: editEventForm.max_participants
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      setEditEventModal(false);
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update event',
        variant: "destructive",
      });
    }
  };

  // Refresh statistics function
  const refreshStatistics = async () => {
    try {
      const { error } = await supabase.rpc('refresh_all_statistics');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Statistics refreshed successfully",
      });

      // Reload data to show updated statistics
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to refresh statistics',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
              <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, organizations, events, and content</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshStatistics} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Statistics
            </Button>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.pas} PAs • {userStats.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orgStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {orgStats.approved} approved • {orgStats.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {eventStats.upcoming} upcoming • {eventStats.past} past
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full" onClick={() => setActiveTab('users')}>
                  Manage Users
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveTab('organizations')}>
                  Manage Organizations
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-600">{user.role}</p>
                      </div>
                      <Badge variant={user.status === 'active' ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations.slice(0, 5).map(org => (
                    <div key={org.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-gray-600">{org.contact_email}</p>
                      </div>
                      <Badge variant={org.status === 'approved' ? "default" : org.status === 'pending' ? "secondary" : "destructive"}>
                        {org.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage all users, PAs, and organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by email or organization name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={emailFilter} onValueChange={setEmailFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                    <SelectItem value="pa">PAs</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Controls */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="outline" onClick={selectAllUsers}>
                  Select All ({filteredUsers.length})
                </Button>
                <Button variant="outline" onClick={selectAllPAs}>
                  Select All PAs ({filteredUsers.filter(u => u.role === 'pa').length})
                </Button>
                <Button variant="outline" onClick={clearUserSelection}>
                  Clear Selection
                </Button>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {user.status === 'pending' && (
                              <Button size="sm" onClick={() => approveUser(user.id)}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {user.role === 'user' && (
                              <Button size="sm" variant="outline" onClick={() => promoteToPA(user.id)}>
                                Promote to PA
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => viewUser(user)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => editUser(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Management
              </CardTitle>
              <CardDescription>
                Manage organization approvals and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Controls */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="outline" onClick={selectAllOrganizations}>
                  Select All ({filteredOrganizations.length})
                </Button>
                <Button variant="outline" onClick={clearOrganizationSelection}>
                  Clear Selection
                </Button>
              </div>

              {/* Organizations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrganizations.map(org => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          {org.description && (
                            <div className="text-sm text-gray-500">{org.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{org.contact_email}</div>
                          {org.phone && (
                            <div className="text-sm text-gray-500">{org.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            org.status === 'approved' ? 'default' : 
                            org.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {org.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {org.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => approveOrganization(org.id)}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => rejectOrganization(org.id, 'Rejected by admin')}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => viewOrganization(org)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => editOrganization(org)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrganizations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No organizations found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Event Management
              </CardTitle>
              <CardDescription>
                View and manage all events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-gray-500">{event.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">{event.organization_name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {event.location || 'TBD'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewEvent(event)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => editEvent(event)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No events found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <ContentManagement />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Time Period Statistics
              </CardTitle>
              <CardDescription>
                View statistics for different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Time Period Selector */}
              <div className="flex items-center gap-4 mb-6">
                <Label htmlFor="time-period">Time Period:</Label>
                <Select value={timePeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setTimePeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={refreshTimeStats} variant="outline" size="sm" disabled={timeStatsLoading}>
                  <RefreshCw className={`w-4 h-4 ${timeStatsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Current Period Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Year</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentYearStats.active_volunteers}</div>
                    <p className="text-xs text-muted-foreground">
                      {currentYearStats.hours_contributed} hours • {currentYearStats.events_count} events
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Month</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentMonthStats.active_volunteers}</div>
                    <p className="text-xs text-muted-foreground">
                      {currentMonthStats.hours_contributed} hours • {currentMonthStats.events_count} events
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentYearStats.signups_count}</div>
                    <p className="text-xs text-muted-foreground">
                      This year
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Signups</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentMonthStats.signups_count}</div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Time Period Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Historical Data - {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeStatsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Loading statistics...</p>
                    </div>
                  ) : timePeriodStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Period</th>
                            <th className="text-left p-2">Active Volunteers</th>
                            <th className="text-left p-2">Hours Contributed</th>
                            <th className="text-left p-2">Events</th>
                            <th className="text-left p-2">Signups</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timePeriodStats.map((stat, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                {new Date(stat.period_start).toLocaleDateString()} - {new Date(stat.period_end).toLocaleDateString()}
                              </td>
                              <td className="p-2 font-medium">{stat.active_volunteers}</td>
                              <td className="p-2">{stat.hours_contributed}</td>
                              <td className="p-2">{stat.events_count}</td>
                              <td className="p-2">{stat.signups_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      <p>No data available for this time period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View User Modal */}
      <Dialog open={viewUserModal} onOpenChange={setViewUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="text-sm text-gray-600">{selectedUser.role}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm text-gray-600">{selectedUser.status}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm text-gray-600">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editUserModal} onOpenChange={setEditUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="pa">PA</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user-status">Status</Label>
              <Select value={editUserForm.status} onValueChange={(value) => setEditUserForm({ ...editUserForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveUser} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditUserModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Organization Modal */}
      <Dialog open={viewOrgModal} onOpenChange={setViewOrgModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
            <DialogDescription>View organization information</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm text-gray-600">{selectedOrg.name}</p>
              </div>
              <div>
                <Label>Contact Email</Label>
                <p className="text-sm text-gray-600">{selectedOrg.contact_email}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm text-gray-600">{selectedOrg.status}</p>
              </div>
              {selectedOrg.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{selectedOrg.description}</p>
                </div>
              )}
              {selectedOrg.website && (
                <div>
                  <Label>Website</Label>
                  <p className="text-sm text-gray-600">{selectedOrg.website}</p>
                </div>
              )}
              {selectedOrg.phone && (
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm text-gray-600">{selectedOrg.phone}</p>
                </div>
              )}
              <div>
                <Label>Created</Label>
                <p className="text-sm text-gray-600">{new Date(selectedOrg.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={editOrgModal} onOpenChange={setEditOrgModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={editOrgForm.name}
                onChange={(e) => setEditOrgForm({ ...editOrgForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-email">Contact Email</Label>
              <Input
                id="org-email"
                value={editOrgForm.contact_email}
                onChange={(e) => setEditOrgForm({ ...editOrgForm, contact_email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={editOrgForm.description}
                onChange={(e) => setEditOrgForm({ ...editOrgForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                value={editOrgForm.website}
                onChange={(e) => setEditOrgForm({ ...editOrgForm, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-phone">Phone</Label>
              <Input
                id="org-phone"
                value={editOrgForm.phone}
                onChange={(e) => setEditOrgForm({ ...editOrgForm, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveOrganization} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditOrgModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={viewEventModal} onOpenChange={setViewEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View event information</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <p className="text-sm text-gray-600">{selectedEvent.title}</p>
              </div>
              {selectedEvent.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              <div>
                <Label>Organization</Label>
                <p className="text-sm text-gray-600">{selectedEvent.organization_name}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm text-gray-600">{new Date(selectedEvent.date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-sm text-gray-600">{selectedEvent.location || 'TBD'}</p>
              </div>
              {selectedEvent.max_participants && (
                <div>
                  <Label>Max Participants</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.max_participants}</p>
                </div>
              )}
              <div>
                <Label>Created</Label>
                <p className="text-sm text-gray-600">{new Date(selectedEvent.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={editEventModal} onOpenChange={setEditEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={editEventForm.title}
                onChange={(e) => setEditEventForm({ ...editEventForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={editEventForm.description}
                onChange={(e) => setEditEventForm({ ...editEventForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={editEventForm.date}
                onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={editEventForm.location}
                onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-max-participants">Max Participants</Label>
              <Input
                id="event-max-participants"
                type="number"
                value={editEventForm.max_participants}
                onChange={(e) => setEditEventForm({ ...editEventForm, max_participants: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEvent} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditEventModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

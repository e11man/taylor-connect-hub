import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, BarChart3, FileText, Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { Statistics } from '@/components/admin/Statistics';

interface User {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  approved: boolean;
  organization_name?: string;
}

interface Event {
  id: string;
  title: string;
  organization_name: string;
  event_date: string;
  status: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [emailFilter, setEmailFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Load users and events
  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          organizations!inner(name)
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

  // Filter users based on search and email filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.organization_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = emailFilter === 'all' || user.user_type === emailFilter;
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
    setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const selectAllPAs = () => {
    const paUsers = filteredUsers.filter(user => user.user_type === 'pa');
    setSelectedUsers(new Set(paUsers.map(user => user.id)));
  };

  // Email functions
  const openEmailClient = () => {
    const selectedEmails = Array.from(selectedUsers)
      .map(userId => users.find(u => u.id === userId)?.email)
      .filter(Boolean)
      .join(',');
    
    if (selectedEmails) {
      window.open(`mailto:${selectedEmails}`, '_blank');
      } else {
      toast({
        title: "No users selected",
        description: "Please select users to email",
        variant: "destructive",
      });
    }
  };

  // Get user stats
  const userStats = {
    total: users.length,
    pas: users.filter(u => u.user_type === 'pa').length,
    organizations: users.filter(u => u.user_type === 'organization').length,
    approved: users.filter(u => u.approved).length,
    pending: users.filter(u => !u.approved).length,
  };

  const eventStats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.event_date) > new Date()).length,
    past: events.filter(e => new Date(e.event_date) <= new Date()).length,
  };

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
              <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, events, and content</p>
              </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
              </Button>
            </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
                </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
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
                  {userStats.pas} PAs • {userStats.organizations} Organizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
                <Badge variant="default" className="h-4 w-4">✓</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.pending} pending approval
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
                <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveTab('content')}>
                  Edit Content
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
                        <p className="text-sm text-gray-600">{user.user_type}</p>
                      </div>
                      <Badge variant={user.approved ? "default" : "secondary"}>
                        {user.approved ? "Approved" : "Pending"}
                      </Badge>
                                  </div>
                  ))}
                              </div>
                            </CardContent>
                          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.organization_name}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(event.event_date).toLocaleDateString()}
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
                  <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                      placeholder="Search by email or organization name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                        />
                      </div>
                </div>
                <Select value={emailFilter} onValueChange={setEmailFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pa">PAs Only</SelectItem>
                    <SelectItem value="organization">Organizations</SelectItem>
                  </SelectContent>
                </Select>
                    </div>

              {/* Email Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Email Controls</span>
                      </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllUsers}>
                    Select All ({filteredUsers.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={selectAllPAs}>
                    Select All PAs ({userStats.pas})
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear Selection
                                    </Button>
                                    <Button
                    size="sm" 
                    onClick={openEmailClient}
                    disabled={selectedUsers.size === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Selected ({selectedUsers.size})
                                    </Button>
                                  </div>
                                </div>

              {/* Users Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => e.target.checked ? selectAllUsers() : clearSelection()}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
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
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.email}</div>
                              {user.organization_name && (
                                <div className="text-sm text-gray-500">{user.organization_name}</div>
                              )}
                                    </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={user.user_type === 'pa' ? 'default' : 'secondary'}>
                              {user.user_type === 'pa' ? 'PA' : 'Organization'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={user.approved ? 'default' : 'destructive'}>
                              {user.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                                </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                                  </div>
                              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria
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
                        Status
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
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">{event.organization_name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={new Date(event.event_date) > new Date() ? 'default' : 'secondary'}>
                            {new Date(event.event_date) > new Date() ? 'Upcoming' : 'Past'}
                      </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                                    </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

        {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <ContentManagement />
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <Statistics />
            </TabsContent>
          </Tabs>
    </div>
  );
};

export default AdminDashboard;

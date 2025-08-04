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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, BarChart3, FileText, Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Download, Upload, Building2, CheckCircle, XCircle, X, Calendar, Clock, TrendingUp, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { Statistics } from '@/components/admin/Statistics';
import { useTimePeriodStatistics } from '@/hooks/useTimePeriodStatistics';
import { useContentSection } from '@/hooks/useContent';
import { useSiteStatistics } from '@/hooks/useSiteStatistics';

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

// Site Statistics Editor Component
const SiteStatisticsEditor = () => {
  const { 
    statistics, 
    loading, 
    error, 
    recalculateStatistics, 
    updateManualOverride, 
    removeManualOverride 
  } = useSiteStatistics();
  
  const [editingStats, setEditingStats] = useState({
    active_volunteers: '',
    hours_contributed: '',
    partner_organizations: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize editing stats when statistics load
  useEffect(() => {
    if (statistics) {
      setEditingStats({
        active_volunteers: statistics.active_volunteers.display_value.toString(),
        hours_contributed: statistics.hours_contributed.display_value.toString(),
        partner_organizations: statistics.partner_organizations.display_value.toString()
      });
    }
  }, [statistics]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update each statistic with manual override
      const updates = [
        { 
          key: 'active_volunteers' as const, 
          value: parseInt(editingStats.active_volunteers) || 0 
        },
        { 
          key: 'hours_contributed' as const, 
          value: parseInt(editingStats.hours_contributed) || 0 
        },
        { 
          key: 'partner_organizations' as const, 
          value: parseInt(editingStats.partner_organizations) || 0 
        }
      ];

      for (const update of updates) {
        await updateManualOverride(update.key, update.value);
      }

      toast({
        title: 'Success',
        description: 'Site statistics updated successfully',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating site statistics:', error);
      toast({
        title: 'Error',
        description: `Failed to update statistics: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (statistics) {
      setEditingStats({
        active_volunteers: statistics.active_volunteers.display_value.toString(),
        hours_contributed: statistics.hours_contributed.display_value.toString(),
        partner_organizations: statistics.partner_organizations.display_value.toString()
      });
    }
    setIsEditing(false);
  };

  const handleRecalculate = async () => {
    try {
      await recalculateStatistics();
      toast({
        title: 'Success',
        description: 'Statistics recalculated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to recalculate statistics: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleResetToCalculated = async () => {
    try {
      setSaving(true);
      
      // Remove manual overrides for all statistics
      await removeManualOverride('active_volunteers');
      await removeManualOverride('hours_contributed');
      await removeManualOverride('partner_organizations');

      toast({
        title: 'Success',
        description: 'Statistics reset to calculated values',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to reset statistics: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Site Statistics</h3>
          <Button onClick={handleRecalculate} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          <p>Error loading statistics: {error}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Site Statistics</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Site Statistics</h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={handleRecalculate} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalculate
              </Button>
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" disabled={saving}>
                <Check className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Volunteers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={editingStats.active_volunteers}
                onChange={(e) => setEditingStats(prev => ({ ...prev, active_volunteers: e.target.value }))}
                placeholder="e.g., 2,500+"
                className="text-2xl font-bold"
              />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {statistics.active_volunteers.display_value.toLocaleString()}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Calculated: {statistics.active_volunteers.calculated_value.toLocaleString()}
              </p>
              {statistics.active_volunteers.manual_override !== null && (
                <Badge variant="secondary" className="text-xs">
                  Manual
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hours Contributed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours Contributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={editingStats.hours_contributed}
                onChange={(e) => setEditingStats(prev => ({ ...prev, hours_contributed: e.target.value }))}
                placeholder="e.g., 15,000+"
                className="text-2xl font-bold"
              />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {statistics.hours_contributed.display_value.toLocaleString()}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Calculated: {statistics.hours_contributed.calculated_value.toLocaleString()}
              </p>
              {statistics.hours_contributed.manual_override !== null && (
                <Badge variant="secondary" className="text-xs">
                  Manual
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Partner Organizations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Partner Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={editingStats.partner_organizations}
                onChange={(e) => setEditingStats(prev => ({ ...prev, partner_organizations: e.target.value }))}
                placeholder="e.g., 50+"
                className="text-2xl font-bold"
              />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {statistics.partner_organizations.display_value.toLocaleString()}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Calculated: {statistics.partner_organizations.calculated_value.toLocaleString()}
              </p>
              {statistics.partner_organizations.manual_override !== null && (
                <Badge variant="secondary" className="text-xs">
                  Manual
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset to Calculated Button */}
      {isEditing && (
        <div className="flex justify-center">
          <Button onClick={handleResetToCalculated} variant="outline" size="sm" disabled={saving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Calculated Values
          </Button>
        </div>
      )}

      {/* Last Updated Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Last calculated: {new Date(statistics.active_volunteers.last_calculated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

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

  // Delete user function
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also remove them from all events they signed up for.')) {
      return;
    }

    try {
      setLoading(true);
      
      // First, delete all user event signups
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', userId);
      
      if (userEventsError) throw userEventsError;

      // Delete from user_roles table
      const { error: userRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (userRolesError) throw userRolesError;

      // Delete from notification_preferences
      const { error: notifPrefsError } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId);
      
      if (notifPrefsError) throw notifPrefsError;

      // Delete any notifications for this user
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
      
      if (notificationsError) throw notificationsError;

      // Finally, delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete user',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete organization function
  const deleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This will also delete all their events and associated data.')) {
      return;
    }

    try {
      setLoading(true);

      // First get all events for this organization
      const { data: orgEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', orgId);

      if (eventsError) throw eventsError;

      // Delete all user_events for the organization's events
      if (orgEvents && orgEvents.length > 0) {
        const eventIds = orgEvents.map(event => event.id);
        
        const { error: userEventsError } = await supabase
          .from('user_events')
          .delete()
          .in('event_id', eventIds);

        if (userEventsError) throw userEventsError;

        // Delete chat messages for the organization's events
        const { error: chatError } = await supabase
          .from('chat_messages')
          .delete()
          .in('event_id', eventIds);

        if (chatError) throw chatError;

        // Delete notifications for the organization's events
        const { error: notificationsError } = await supabase
          .from('notifications')
          .delete()
          .in('event_id', eventIds);

        if (notificationsError) throw notificationsError;
      }

      // Delete all events for this organization
      const { error: deleteEventsError } = await supabase
        .from('events')
        .delete()
        .eq('organization_id', orgId);

      if (deleteEventsError) throw deleteEventsError;

      // Finally delete the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (orgError) throw orgError;

      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete organization',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete event function
  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will remove all user sign-ups and related data.')) {
      return;
    }

    try {
      setLoading(true);

      // Delete user events first
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('event_id', eventId);

      if (userEventsError) throw userEventsError;

      // Delete chat messages
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('event_id', eventId);

      if (chatError) throw chatError;

      // Delete notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('event_id', eventId);

      if (notificationsError) throw notificationsError;

      // Finally delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) throw eventError;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete event',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      const formattedEvents = eventsData?.map(event => ({
        ...event,
        organization_name: event.organizations?.name || 'Unknown Organization'
      })) || [];
      setEvents(formattedEvents);
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
    const matchesFilter = emailFilter === 'all' || user.role === emailFilter;
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

  // Email functionality
  const handleEmailSelectedUsers = () => {
    const selectedUserEmails = filteredUsers
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email);
    
    if (selectedUserEmails.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to email",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with all selected emails
    const mailtoLink = `mailto:${selectedUserEmails.join(',')}`;
    
    // Open native email app
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email app opened",
      description: `Email app opened with ${selectedUserEmails.length} recipient(s)`,
    });
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

  // Email functionality for organizations
  const handleEmailSelectedOrganizations = () => {
    const selectedOrgEmails = filteredOrganizations
      .filter(org => selectedOrganizations.has(org.id))
      .map(org => org.contact_email);
    
    if (selectedOrgEmails.length === 0) {
      toast({
        title: "No organizations selected",
        description: "Please select at least one organization to email",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with all selected organization emails
    const mailtoLink = `mailto:${selectedOrgEmails.join(',')}`;
    
    // Open native email app
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email app opened",
      description: `Email app opened with ${selectedOrgEmails.length} organization(s)`,
    });
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
      // Update both profiles and user_roles tables
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'pa' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Also update or insert into user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: 'pa' 
        }, { 
          onConflict: 'user_id' 
        });

      if (roleError) throw roleError;

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
       // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: editUserForm.email,
          role: editUserForm.role as "pa" | "admin" | "user",
          status: editUserForm.status
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Also update user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: selectedUser.id, 
          role: editUserForm.role as "pa" | "admin" | "user"
        }, { 
          onConflict: 'user_id' 
        });

      if (roleError) throw roleError;

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
                {selectedUsers.size > 0 && (
                  <Button 
                    variant="default" 
                    onClick={handleEmailSelectedUsers}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Selected ({selectedUsers.size})
                  </Button>
                )}
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllUsers();
                            } else {
                              clearUserSelection();
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
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
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
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
                             <Button 
                               size="sm" 
                               variant="destructive" 
                               onClick={() => {
                                 if (confirm(`Are you sure you want to delete user ${user.email}? This will remove them from all events and cannot be undone.`)) {
                                   deleteUser(user.id);
                                 }
                               }}
                             >
                               <Trash2 className="w-4 h-4" />
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
                {selectedOrganizations.size > 0 && (
                  <Button 
                    variant="default" 
                    onClick={handleEmailSelectedOrganizations}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Selected ({selectedOrganizations.size})
                  </Button>
                )}
              </div>

              {/* Organizations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedOrganizations.size === filteredOrganizations.length && filteredOrganizations.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllOrganizations();
                            } else {
                              clearOrganizationSelection();
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
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
                          <input
                            type="checkbox"
                            checked={selectedOrganizations.has(org.id)}
                            onChange={() => toggleOrganizationSelection(org.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
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
                            <Button size="sm" variant="destructive" onClick={() => deleteOrganization(org.id)}>
                              <Trash2 className="w-4 h-4" />
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
          {/* Site Statistics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Site Statistics
              </CardTitle>
              <CardDescription>
                Edit the statistics displayed on the homepage and about page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SiteStatisticsEditor />
            </CardContent>
          </Card>

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

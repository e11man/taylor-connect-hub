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

  // Test function to verify Supabase integration
  const testSupabaseIntegration = async () => {
    try {
      console.log('=== Testing Supabase Integration ===');
      
      // Test 1: Check if profiles table exists and is accessible
      console.log('Test 1: Checking profiles table...');
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, dorm, wing, status')
        .limit(1);
      
      if (profilesError) {
        console.error('Profiles table test failed:', profilesError);
      } else {
        console.log('✓ Profiles table accessible');
      }
      
      // Test 2: Check if user_roles table exists and is accessible
      console.log('Test 2: Checking user_roles table...');
      const { data: rolesTest, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(1);
      
      if (rolesError) {
        console.error('User_roles table test failed:', rolesError);
      } else {
        console.log('✓ User_roles table accessible');
      }
      
      // Test 3: Check if profiles table has role column
      console.log('Test 3: Checking if profiles has role column...');
      const { data: profilesRoleTest, error: profilesRoleError } = await supabase
        .from('profiles')
        .select('user_id, role')
        .limit(1);
      
      if (profilesRoleError) {
        if (profilesRoleError.message.includes('role') || profilesRoleError.message.includes('column')) {
          console.log('✓ Profiles table does not have role column (expected, will use user_roles)');
        } else {
          console.error('Unexpected error testing profiles role column:', profilesRoleError);
        }
      } else {
        console.log('✓ Profiles table has role column');
      }
      
      // Test 4: Check organizations table
      console.log('Test 4: Checking organizations table...');
      const { data: orgsTest, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, status')
        .limit(1);
      
      if (orgsError) {
        console.error('Organizations table test failed:', orgsError);
      } else {
        console.log('✓ Organizations table accessible');
      }
      
      // Test 5: Check events table
      console.log('Test 5: Checking events table...');
      const { data: eventsTest, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date')
        .limit(1);
      
      if (eventsError) {
        console.error('Events table test failed:', eventsError);
      } else {
        console.log('✓ Events table accessible');
      }
      
      console.log('=== Supabase Integration Test Complete ===');
      
      toast({
        title: "Database Test Complete",
        description: "Check console for detailed results",
      });
      
    } catch (error) {
      console.error('Supabase integration test failed:', error);
      toast({
        title: "Database Test Failed",
        description: "Check console for error details",
        variant: "destructive",
      });
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
      
      // Check if using demo admin authentication
      const isDemo = localStorage.getItem('admin_authenticated') === 'true';
      
      if (isDemo && !user) {
        // For demo authentication, create mock users
        console.log('Using demo authentication - creating mock user data');
        
        const mockUsers = [
          {
            id: '61a4e765-03ba-4c89-a448-86d6fbe043bf',
            email: 'josh_ellman@taylor.edu',
            created_at: '2025-07-25T00:00:00Z',
            profiles: {
              dorm: 'Bergwall Hall',
              wing: '3rd Bergwall',
              status: 'active',
              role: 'user'
            },
            user_roles: [{ role: 'user' }]
          },
          {
            id: '70564c92-d24a-4b09-8b76-704556269f0',
            email: 'admin@taylor.edu',
            created_at: '2025-07-24T00:00:00Z',
            profiles: {
              dorm: 'NULL',
              wing: 'NULL',
              status: 'active',
              role: 'admin'
            },
            user_roles: [{ role: 'admin' }]
          }
        ];
        
        setUsers(mockUsers.filter(user => user.profiles.status === 'active'));
        setPendingUsers(mockUsers.filter(user => user.profiles.status === 'pending'));
        return;
      }

      // Always fetch both profiles and user_roles separately for better reliability
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
      
      // Final fallback for demo users
      const isDemo = localStorage.getItem('admin_authenticated') === 'true';
      if (isDemo) {
        const mockUsers = [
          {
            id: 'fallback-user-1',
            email: 'demo@taylor.edu',
            created_at: new Date().toISOString(),
            profiles: {
              dorm: 'Demo Dorm',
              wing: 'Demo Wing', 
              status: 'active',
              role: 'user'
            },
            user_roles: [{ role: 'user' }]
          }
        ];
        setUsers(mockUsers);
        setPendingUsers([]);
      } else {
        // Set empty arrays as fallback for real auth
        setUsers([]);
        setPendingUsers([]);
      }
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
        // Fallback for demo authentication
        const isDemo = localStorage.getItem('admin_authenticated') === 'true';
        if (isDemo) {
          const mockOrganizations = [
            {
              id: 'demo-org-1',
              name: 'Demo Organization',
              description: 'A demo organization for testing',
              website: null,
              phone: null,
              contact_email: 'demo@organization.com',
              status: 'approved',
              created_at: new Date().toISOString()
            }
          ];
          setOrganizations(mockOrganizations);
          setPendingOrganizations([]);
          return;
        }
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
        // Fallback for demo authentication
        const isDemo = localStorage.getItem('admin_authenticated') === 'true';
        if (isDemo) {
          const mockEvents = [
            {
              id: 'demo-event-1',
              title: 'Demo Community Event',
              description: 'A demo event for testing the admin console',
              date: new Date().toISOString(),
              location: 'Demo Location',
              max_participants: null,
              organization_id: null,
              organizations: { name: 'Demo Organization' }
            }
          ];
          setEvents(mockEvents);
          return;
        }
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
      console.log(`Is demo admin:`, localStorage.getItem('admin_authenticated') === 'true');
      
      // Validate inputs
      if (!userId || !newRole) {
        throw new Error('User ID and role are required');
      }
      
      if (!['admin', 'pa', 'user'].includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      // For demo authentication, we still need to update the actual database
      // The issue is RLS policies require authenticated user, so we'll use direct updates
      const isDemo = localStorage.getItem('admin_authenticated') === 'true';
      if (isDemo && !user) {
        console.log('Demo mode: Attempting direct database update');
        
        try {
           // Try to update the profiles table directly (this should work with the new schema)
           const { error: profileUpdateError } = await supabase
             .from('profiles')
             .update({ role: newRole })
             .eq('user_id', userId);

           if (profileUpdateError) {
             console.error('Profile update failed in demo mode:', profileUpdateError);
             
             // Try updating user_roles table as fallback
             const { error: roleUpdateError } = await supabase
               .from('user_roles')
               .update({ role: newRole })
               .eq('user_id', userId);

             if (roleUpdateError) {
               console.error('user_roles update also failed:', roleUpdateError);
               
               // Final fallback to local state update
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
               
               toast({
                 title: "Demo Mode - Local Update Only",
                 description: `Role updated locally to ${newRole}. Database RLS policies prevent updates.`,
                 variant: "destructive"
               });
               return;
             }
           }

           // Also try to sync user_roles table if profiles update succeeded
           if (!profileUpdateError) {
             const { error: roleUpdateError } = await supabase
               .from('user_roles')
               .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

             if (roleUpdateError) {
               console.warn('user_roles sync failed, but profiles updated:', roleUpdateError);
             }
           }

           // Update local state to reflect database changes
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
           
           toast({
             title: "Success (Demo Mode)",
             description: `User role updated to ${newRole} in database`,
           });
           
           return;
         } catch (error) {
           console.error('Demo mode database update failed:', error);
           // Fallback to local update
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
           
           toast({
             title: "Demo Mode - Local Update Only",
             description: `Role updated locally to ${newRole}. Database access restricted.`,
             variant: "destructive"
           });
           return;
         }
      }

      // Check if user exists in profiles table first
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('user_id', userId)
        .single();

      if (profileCheckError) {
        console.error('User profile not found:', profileCheckError);
        throw new Error('User not found in system');
      }

      console.log('User profile found:', userProfile.email);

      // First, ensure the user has a role entry in user_roles table
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing role:', checkError);
        throw checkError;
      }

      console.log('Existing role:', existingRole?.role || 'none');

      // Update or insert into user_roles table
      if (existingRole) {
        console.log('Updating existing role...');
        const { error: updateRoleError } = await supabase
          .from('user_roles')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (updateRoleError) {
          console.error('Failed to update role:', updateRoleError);
          console.error('Update error details:', {
            message: updateRoleError.message,
            details: updateRoleError.details,
            hint: updateRoleError.hint,
            code: updateRoleError.code
          });
          throw updateRoleError;
        }
        console.log('Role updated successfully in user_roles table');
      } else {
        console.log('Creating new role entry...');
        const { error: insertRoleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: newRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertRoleError) {
          console.error('Failed to insert role:', insertRoleError);
          console.error('Insert error details:', {
            message: insertRoleError.message,
            details: insertRoleError.details,
            hint: insertRoleError.hint,
            code: insertRoleError.code
          });
          throw insertRoleError;
        }
        console.log('Role created successfully in user_roles table');
      }

      // Try to update role in profiles table as well (for optimization)
      try {
        console.log('Attempting to update role in profiles table...');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('user_id', userId);
        
        if (profileError) {
          // If profiles update fails due to schema issues, that's okay - user_roles is the source of truth
          if (profileError.message.includes('role') || profileError.message.includes('schema') || profileError.message.includes('column')) {
            console.warn('Profiles table does not have role column, using user_roles as source of truth');
          } else {
            console.warn('Profiles table update failed:', profileError.message);
          }
        } else {
          console.log('Role updated successfully in profiles table');
        }
      } catch (profileUpdateError) {
        console.warn('Profiles table role update failed, but user_roles was updated successfully:', profileUpdateError);
      }

      // Verify the update was successful
      const { data: verifyRole, error: verifyError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (verifyError || !verifyRole || verifyRole.role !== newRole) {
        console.error('Role update verification failed:', verifyError);
        throw new Error('Role update could not be verified');
      }

      console.log('Role update verified successfully');

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      // Refresh the user list to show updated roles
      await fetchUsers();
    } catch (error: any) {
      console.error('Role update error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update user role',
        variant: "destructive",
      });
    }
  };

  const handleUserStatusChange = async (userId: string, status: string) => {
    try {
      console.log(`Updating user ${userId} status to ${status}`);
      
      // Validate inputs
      if (!userId || !status) {
        throw new Error('User ID and status are required');
      }
      
      if (!['active', 'pending', 'blocked'].includes(status)) {
        throw new Error('Invalid status specified');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Status update failed:', error);
        throw error;
      }

      console.log('User status updated successfully');
      toast({
        title: "Success",
        description: `User ${status === 'active' ? 'approved' : status === 'blocked' ? 'blocked' : 'set to pending'}`,
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update user status',
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
      console.log(`Resetting password for user: ${email}`);
      
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Valid email is required for password reset');
      }

      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) {
        console.error('Password reset failed:', error);
        throw error;
      }

      console.log('Password reset email sent successfully');
      toast({
        title: "Success",
        description: "Password reset email sent",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to send password reset email',
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
      console.log(`Updating user ${editingUser.id}:`, editUser);
      
      // Validate inputs
      if (!editUser.email || !editUser.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!editUser.dorm || !editUser.wing) {
        throw new Error('Dorm and wing are required');
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: editUser.email.trim(),
          dorm: editUser.dorm.trim(),
          wing: editUser.wing.trim(),
        })
        .eq('user_id', editingUser.id);

      if (profileError) {
        console.error('Profile update failed:', profileError);
        throw profileError;
      }
      
      console.log('Profile updated successfully');

      // Update role using the robust role change function
      if (editUser.role !== editingUser.profiles.role) {
        await handleUserRoleChange(editingUser.id, editUser.role);
      }

      setIsEditUserModalOpen(false);
      setEditingUser(null);
      setEditUser({ email: '', dorm: '', wing: '', role: 'user' });
      
      toast({
        title: "Success!",
        description: "User updated successfully.",
      });
      
      // Refresh users to show changes
      await fetchUsers();
    } catch (error: any) {
      console.error('User edit error:', error);
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
              role: user.profiles.role as 'admin' | 'pa' | 'user' || 'user'
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
            <div className="flex gap-2 self-end sm:self-auto">
              <Button 
                onClick={testSupabaseIntegration}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Test DB</span>
                <span className="sm:hidden">Test</span>
              </Button>
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
              <Select
                value={editUser.dorm}
                onValueChange={(value) => setEditUser({...editUser, dorm: value, wing: ''})} // Reset wing when dorm changes
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Dorm" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.keys(dormAndFloorData).map((dorm) => (
                    <SelectItem key={dorm} value={dorm}>
                      {dorm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-user-wing">Wing/Floor*</Label>
              <Select
                value={editUser.wing}
                onValueChange={(value) => setEditUser({...editUser, wing: value})}
                disabled={!editUser.dorm}
              >
                <SelectTrigger>
                  <SelectValue placeholder={editUser.dorm ? "Select Wing/Floor" : "Select dorm first"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {editUser.dorm && dormAndFloorData[editUser.dorm as keyof typeof dormAndFloorData]?.map((wing) => (
                    <SelectItem key={wing} value={wing}>
                      {wing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
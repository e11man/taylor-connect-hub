import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Home, Shield, Bell, Save, KeyRound, Building, Info } from 'lucide-react';
import { ChangeDormModal } from '@/components/modals/ChangeDormModal';
import { UpdatePasswordModal } from '@/components/modals/UpdatePasswordModal';
import { dormAndFloorData } from '@/utils/dormData';

interface UserProfile {
  id: string;
  email: string;
  dorm: string | null;
  wing: string | null;
  role: 'admin' | 'pa' | 'user';
  user_type: string | null;
  status: string;
  created_at: string;
}

interface NotificationPreferences {
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  chat_notifications: boolean;
  event_updates: boolean;
}

export const ProfileSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_frequency: 'immediate',
    chat_notifications: true,
    event_updates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changeDormModalOpen, setChangeDormModalOpen] = useState(false);
  const [updatePasswordModalOpen, setUpdatePasswordModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setOriginalProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_notification_preferences', { p_user_id: user.id });

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data && data.length > 0) {
        const userPreferences = data[0];
        setPreferences({
          email_frequency: userPreferences.email_frequency as any,
          chat_notifications: userPreferences.chat_notifications,
          event_updates: userPreferences.event_updates,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // Don't show error toast here since this might not be implemented yet
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: profile.email,
          dorm: profile.dorm,
          wing: profile.wing,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Save notification preferences
      try {
        await supabase
          .rpc('upsert_notification_preferences', {
            p_user_id: user.id,
            p_email_frequency: preferences.email_frequency,
            p_chat_notifications: preferences.chat_notifications,
            p_event_updates: preferences.event_updates,
          });
      } catch (prefError) {
        console.error('Error saving notification preferences:', prefError);
        // Don't fail the entire save operation
      }

      setOriginalProfile(profile);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!profile || !originalProfile) return false;
    return (
      profile.email !== originalProfile.email ||
      profile.dorm !== originalProfile.dorm ||
      profile.wing !== originalProfile.wing
    );
  };

  const saveDormChanges = async (dorm: string | null, wing: string | null) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dorm, wing })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Dorm updated",
        description: "Your dorm and wing information has been updated",
      });
    } catch (error) {
      console.error('Error updating dorm:', error);
      toast({
        title: "Error",
        description: "Failed to update dorm information",
        variant: "destructive",
      });
    }
  };

  const getAvailableWings = (dormName: string | null) => {
    if (!dormName) return [];
    return dormAndFloorData[dormName as keyof typeof dormAndFloorData] || [];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'pa': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Loading your profile...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Unable to load profile information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role and Status Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Role</Label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                  {profile.role.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {profile.role === 'admin' ? 'Administrator' : 
                   profile.role === 'pa' ? 'PA (Peer Advisor)' : 
                   'Student User'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Status</Label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.status.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-sm text-muted-foreground">
              This email will be used for notifications and account recovery
            </p>
          </div>

          {/* Dorm Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Residence Hall
              </Label>
              <Select
                value={profile.dorm || ''}
                onValueChange={(value) => {
                  setProfile(prev => prev ? { ...prev, dorm: value, wing: null } : null);
                  saveDormChanges(value, null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No dorm selected" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(dormAndFloorData).map((dormName) => (
                    <SelectItem key={dormName} value={dormName}>
                      {dormName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Wing/Floor
              </Label>
              <Select
                value={profile.wing || ''}
                onValueChange={(value) => {
                  setProfile(prev => prev ? { ...prev, wing: value } : null);
                  saveDormChanges(profile.dorm, value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No wing selected" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableWings(profile.dorm).map((wing) => (
                    <SelectItem key={wing} value={wing}>
                      {wing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              You can update your dorm and wing information below. Changes will be saved automatically.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setChangeDormModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Change Dorm/Wing
            </Button>
            <Button
              variant="outline"
              onClick={() => setUpdatePasswordModalOpen(true)}
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications about events and messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Email Frequency
              </Label>
              <Select
                value={preferences.email_frequency}
                onValueChange={(value: any) => 
                  setPreferences(prev => ({ ...prev, email_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (real-time)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly summary</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how often you want to receive email notifications
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  Chat Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone posts in event chats you're part of
                </p>
              </div>
              <Switch
                checked={preferences.chat_notifications}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, chat_notifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  Event Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about changes to events you're signed up for
                </p>
              </div>
              <Switch
                checked={preferences.event_updates}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, event_updates: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveProfile} 
          disabled={saving || !hasChanges()}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Modals */}
      <ChangeDormModal
        isOpen={changeDormModalOpen}
        onClose={() => setChangeDormModalOpen(false)}
        currentDorm={profile.dorm}
        currentWing={profile.wing}
        onUpdate={fetchUserProfile}
      />

      <UpdatePasswordModal
        isOpen={updatePasswordModalOpen}
        onClose={() => setUpdatePasswordModalOpen(false)}
      />
    </div>
  );
};
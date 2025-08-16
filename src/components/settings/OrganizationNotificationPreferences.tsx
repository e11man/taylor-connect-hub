import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, MessageSquare, Calendar, Users, UserX, FileText, Megaphone } from 'lucide-react';

interface OrganizationNotificationPreferences {
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  chat_notifications: boolean;
  event_updates: boolean;
  volunteer_signups: boolean;
  volunteer_cancellations: boolean;
  weekly_summary: boolean;
  system_updates: boolean;
}

export const OrganizationNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<OrganizationNotificationPreferences>({
    email_frequency: 'immediate',
    chat_notifications: true,
    event_updates: true,
    volunteer_signups: true,
    volunteer_cancellations: true,
    weekly_summary: true,
    system_updates: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_notification_preferences', { p_user_id: user.id });

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data && data.length > 0) {
        const orgPreferences = data[0];
        setPreferences({
          email_frequency: orgPreferences.email_frequency as any,
          chat_notifications: orgPreferences.chat_notifications,
          event_updates: orgPreferences.event_updates,
          volunteer_signups: orgPreferences.volunteer_signups ?? true,
          volunteer_cancellations: orgPreferences.volunteer_cancellations ?? true,
          weekly_summary: orgPreferences.weekly_summary ?? true,
          system_updates: orgPreferences.system_updates ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.rpc('upsert_notification_preferences', {
        p_user_id: user.id,
        p_email_frequency: preferences.email_frequency,
        p_chat_notifications: preferences.chat_notifications,
        p_event_updates: preferences.event_updates,
        p_volunteer_signups: preferences.volunteer_signups,
        p_volunteer_cancellations: preferences.volunteer_cancellations,
        p_weekly_summary: preferences.weekly_summary,
        p_system_updates: preferences.system_updates,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Manage email notifications for your organization's events and activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading preferences...</div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email-frequency" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Frequency
              </Label>
              <Select
                value={preferences.email_frequency}
                onValueChange={(value: any) => 
                  setPreferences({ ...preferences, email_frequency: value })
                }
              >
                <SelectTrigger id="email-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often you want to receive email notifications
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone sends a message in your event chats
                  </p>
                </div>
                <Switch
                  checked={preferences.chat_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, chat_notifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about changes to your events
                  </p>
                </div>
                <Switch
                  checked={preferences.event_updates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, event_updates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Volunteer Sign-ups
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when volunteers sign up for your events
                  </p>
                </div>
                <Switch
                  checked={preferences.volunteer_signups}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, volunteer_signups: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Volunteer Cancellations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when volunteers cancel their sign-ups
                  </p>
                </div>
                <Switch
                  checked={preferences.volunteer_cancellations}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, volunteer_cancellations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Weekly Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly reports about your organization's activities
                  </p>
                </div>
                <Switch
                  checked={preferences.weekly_summary}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, weekly_summary: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    System Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important announcements and platform updates
                  </p>
                </div>
                <Switch
                  checked={preferences.system_updates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, system_updates: checked })
                  }
                />
              </div>
            </div>

            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
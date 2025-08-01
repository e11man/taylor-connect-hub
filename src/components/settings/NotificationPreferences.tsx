import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';

interface NotificationPreferences {
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  chat_notifications: boolean;
  event_updates: boolean;
}

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_frequency: 'immediate',
    chat_notifications: true,
    event_updates: true,
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
        const userPreferences = data[0];
        setPreferences({
          email_frequency: userPreferences.email_frequency as any,
          chat_notifications: userPreferences.chat_notifications,
          event_updates: userPreferences.event_updates,
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
      const { error } = await supabase
        .rpc('upsert_notification_preferences', {
          p_user_id: user.id,
          p_email_frequency: preferences.email_frequency,
          p_chat_notifications: preferences.chat_notifications,
          p_event_updates: preferences.event_updates,
        });

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated",
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications about events and chat messages
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
                <MessageSquare className="h-4 w-4" />
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
                <Calendar className="h-4 w-4" />
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

        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};
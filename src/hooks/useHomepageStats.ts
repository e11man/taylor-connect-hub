import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepageStats {
  active_volunteers: number;
  hours_contributed: number;
  partner_organizations: number;
}

export const useHomepageStats = () => {
  const [stats, setStats] = useState<HomepageStats>({
    active_volunteers: 0,
    hours_contributed: 0,
    partner_organizations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_homepage_stats');

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching homepage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for user_events table to update stats
    const userEventsChannel = supabase
      .channel('user_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_events'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for events table to update stats
    const eventsChannel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userEventsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
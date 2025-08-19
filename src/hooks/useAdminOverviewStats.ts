import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminOverviewStats {
  activeVolunteers: number;
  partnerOrganizations: number;
}

export const useAdminOverviewStats = () => {
  const [stats, setStats] = useState<AdminOverviewStats>({
    activeVolunteers: 0,
    partnerOrganizations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Count ONLY actual users, excluding organizations (same as admin overview)
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('user_type', 'organization');

      if (usersError) throw usersError;

      // Count all organizations (same as admin overview)
      const { count: orgsCount, error: orgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      if (orgsError) throw orgsError;

      setStats({
        activeVolunteers: usersCount || 0,
        partnerOrganizations: orgsCount || 0,
      });
    } catch (err: any) {
      console.error('Error fetching admin overview stats:', err);
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to changes in relevant tables for real-time updates
    const channel = supabase
      .channel('admin_overview_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
};


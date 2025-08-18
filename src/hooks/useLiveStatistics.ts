import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteStatistic {
  calculated_value: number;
  manual_override: number | null;
  display_value: number;
  last_calculated_at: string;
}

interface LiveStatistics {
  active_volunteers: SiteStatistic;
  hours_contributed: SiteStatistic;
  partner_organizations: SiteStatistic;
}

export const useLiveStatistics = () => {
  const [statistics, setStatistics] = useState<LiveStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the API endpoint to get calculated statistics
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/site-statistics' 
        : 'http://localhost:3001/api/site-statistics';

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }

      setStatistics(result.data);
    } catch (err: any) {
      console.error('Error fetching live statistics:', err);
      setError(err.message);
      
      // Fallback to default values if API is not available
      setStatistics({
        active_volunteers: {
          calculated_value: 2500,
          manual_override: null,
          display_value: 2500,
          last_calculated_at: new Date().toISOString()
        },
        hours_contributed: {
          calculated_value: 15000,
          manual_override: null,
          display_value: 15000,
          last_calculated_at: new Date().toISOString()
        },
        partner_organizations: {
          calculated_value: 50,
          manual_override: null,
          display_value: 50,
          last_calculated_at: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchStatistics();

    // Subscribe to changes in relevant tables for real-time updates
    const channel = supabase
      .channel('live_statistics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles'
        }, 
        () => {
          // Refetch statistics when profiles change
          fetchStatistics();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_events'
        }, 
        () => {
          // Refetch statistics when user_events change
          fetchStatistics();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'organizations'
        }, 
        () => {
          // Refetch statistics when organizations change
          fetchStatistics();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'site_stats'
        }, 
        () => {
          // Refetch when manual overrides are updated
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};
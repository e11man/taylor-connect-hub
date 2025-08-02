import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteStatistic {
  calculated_value: number;
  manual_override: number | null;
  display_value: number;
  last_calculated_at: string;
}

interface SiteStatistics {
  active_volunteers: SiteStatistic;
  hours_contributed: SiteStatistic;
  partner_organizations: SiteStatistic;
}

export const useSiteStatistics = () => {
  const [statistics, setStatistics] = useState<SiteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new API endpoint
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
      console.error('Error fetching site statistics:', err);
      setError(err.message);
      
      // Fallback to default values if API is not available
      setStatistics({
        active_volunteers: {
          calculated_value: 0,
          manual_override: null,
          display_value: 0,
          last_calculated_at: new Date().toISOString()
        },
        hours_contributed: {
          calculated_value: 0,
          manual_override: null,
          display_value: 0,
          last_calculated_at: new Date().toISOString()
        },
        partner_organizations: {
          calculated_value: 0,
          manual_override: null,
          display_value: 0,
          last_calculated_at: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const recalculateStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/site-statistics' 
        : 'http://localhost:3001/api/site-statistics';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to recalculate statistics');
      }

      setStatistics(result.data);
      return result.data;
    } catch (err: any) {
      console.error('Error recalculating statistics:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateManualOverride = async (statType: keyof SiteStatistics, value: number | null) => {
    try {
      setError(null);

      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/site-statistics' 
        : 'http://localhost:3001/api/site-statistics';

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stat_type: statType,
          manual_override: value
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update manual override');
      }

      setStatistics(result.data);
      return result.data;
    } catch (err: any) {
      console.error('Error updating manual override:', err);
      setError(err.message);
      throw err;
    }
  };

  const removeManualOverride = async (statType: keyof SiteStatistics) => {
    try {
      setError(null);

      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/site-statistics' 
        : 'http://localhost:3001/api/site-statistics';

      const response = await fetch(`${apiUrl}?stat_type=${statType}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove manual override');
      }

      setStatistics(result.data);
      return result.data;
    } catch (err: any) {
      console.error('Error removing manual override:', err);
      setError(err.message);
      throw err;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchStatistics();

    // Subscribe to changes in user_events and events tables
    const channel = supabase
      .channel('site_statistics_changes')
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
          table: 'events'
        }, 
        () => {
          // Refetch statistics when events change
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
    fetchStatistics,
    recalculateStatistics,
    updateManualOverride,
    removeManualOverride
  };
}; 
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Statistics {
  active_volunteers: string;
  hours_contributed: string;
  partner_organizations: string;
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    active_volunteers: '2,500',
    hours_contributed: '5,000',
    partner_organizations: '50'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('site_stats_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'site_stats' 
        }, 
        () => {
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .select('stat_type, confirmed_total, current_estimate');

      if (error) throw error;

      if (data) {
        const stats: Statistics = {
          active_volunteers: '2,500',
          hours_contributed: '5,000',
          partner_organizations: '50'
        };

        data.forEach(stat => {
          // Use current_estimate if available and greater than confirmed_total, otherwise use confirmed_total
          const value = stat.current_estimate > stat.confirmed_total 
            ? stat.current_estimate 
            : stat.confirmed_total;
          
          const formattedValue = new Intl.NumberFormat('en-US').format(value);
          
          switch (stat.stat_type) {
            case 'active_volunteers':
              stats.active_volunteers = formattedValue;
              break;
            case 'hours_contributed':
              stats.hours_contributed = formattedValue;
              break;
            case 'partner_organizations':
              stats.partner_organizations = formattedValue;
              break;
          }
        });

        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  return { statistics, loading };
};
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
      .channel('statistics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'statistics' 
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
        .from('statistics')
        .select('key, base_value, live_value');

      if (error) throw error;

      if (data) {
        const stats: Statistics = {
          active_volunteers: '2,500',
          hours_contributed: '5,000',
          partner_organizations: '50'
        };

        data.forEach(stat => {
          // Use live_value if available and greater than base_value, otherwise use base_value
          const value = stat.live_value > stat.base_value 
            ? stat.live_value 
            : stat.base_value;
          
          const formattedValue = new Intl.NumberFormat('en-US').format(value);
          
          switch (stat.key) {
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
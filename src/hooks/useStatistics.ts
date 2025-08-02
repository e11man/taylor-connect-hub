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

    // Subscribe to real-time updates from the content table
    const channel = supabase
      .channel('statistics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'content',
          filter: 'page=eq.homepage AND section=eq.impact'
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
      // Fetch statistics from the content table where the database triggers update them
      const { data, error } = await supabase
        .from('content')
        .select('key, value')
        .eq('page', 'homepage')
        .eq('section', 'impact')
        .in('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']);

      if (error) throw error;

      if (data) {
        const stats: Statistics = {
          active_volunteers: '0',
          hours_contributed: '0',
          partner_organizations: '0'
        };

        data.forEach(stat => {
          const value = parseInt(stat.value) || 0;
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
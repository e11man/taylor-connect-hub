import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimePeriodStats {
  period_start: string;
  period_end: string;
  active_volunteers: number;
  hours_contributed: number;
  events_count: number;
  signups_count: number;
}

interface CurrentPeriodStats {
  active_volunteers: number;
  hours_contributed: number;
  events_count: number;
  signups_count: number;
}

export const useTimePeriodStatistics = (periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
  const [timePeriodStats, setTimePeriodStats] = useState<TimePeriodStats[]>([]);
  const [currentYearStats, setCurrentYearStats] = useState<CurrentPeriodStats>({
    active_volunteers: 0,
    hours_contributed: 0,
    events_count: 0,
    signups_count: 0
  });
  const [currentMonthStats, setCurrentMonthStats] = useState<CurrentPeriodStats>({
    active_volunteers: 0,
    hours_contributed: 0,
    events_count: 0,
    signups_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimePeriodStatistics();
    fetchCurrentPeriodStats();
  }, [periodType]);

  const fetchTimePeriodStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_statistics_by_period', {
        p_period_type: periodType
      });

      if (error) throw error;

      if (data) {
        setTimePeriodStats(data);
      }
    } catch (error) {
      console.error('Error fetching time period statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPeriodStats = async () => {
    try {
      // Fetch current year statistics
      const { data: yearData, error: yearError } = await supabase.rpc('get_current_year_statistics');
      if (yearError) throw yearError;
      if (yearData && yearData.length > 0) {
        setCurrentYearStats(yearData[0]);
      }

      // Fetch current month statistics
      const { data: monthData, error: monthError } = await supabase.rpc('get_current_month_statistics');
      if (monthError) throw monthError;
      if (monthData && monthData.length > 0) {
        setCurrentMonthStats(monthData[0]);
      }
    } catch (error) {
      console.error('Error fetching current period statistics:', error);
    }
  };

  const refreshStatistics = async () => {
    setLoading(true);
    await fetchTimePeriodStatistics();
    await fetchCurrentPeriodStats();
  };

  return {
    timePeriodStats,
    currentYearStats,
    currentMonthStats,
    loading,
    refreshStatistics
  };
}; 
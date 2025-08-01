import { useState, useEffect } from 'react';

interface Statistic {
  key: string;
  base_value: number;
  live_value: number;
  total_value: number;
  description: string;
}

interface StatisticsResponse {
  success: boolean;
  data: Statistic[];
  error?: string;
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching statistics from:', 'http://localhost:3001/api/statistics');
      const response = await fetch('http://localhost:3001/api/statistics');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const result: StatisticsResponse = await response.json();
      console.log('Parsed result:', result);
      
      if (result.success && result.data) {
        setStatistics(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateBaseValue = async (key: string, baseValue: number) => {
    try {
      const response = await fetch('http://localhost:3001/api/statistics/base', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, base_value: baseValue })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchStatistics(); // Refresh the data
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update base value');
      }
    } catch (err) {
      console.error('Error updating base value:', err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updateLiveValue = async (key: string, liveValue: number) => {
    try {
      const response = await fetch('http://localhost:3001/api/statistics/live', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, live_value: liveValue })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchStatistics(); // Refresh the data
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update live value');
      }
    } catch (err) {
      console.error('Error updating live value:', err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const recalculateStatistics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/statistics/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchStatistics(); // Refresh the data
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to recalculate statistics');
      }
    } catch (err) {
      console.error('Error recalculating statistics:', err);
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    updateBaseValue,
    updateLiveValue,
    recalculateStatistics
  };
}; 
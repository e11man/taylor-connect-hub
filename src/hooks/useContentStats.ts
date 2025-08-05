import { useState, useEffect } from 'react';

interface ContentStats {
  volunteers_count: string;
  hours_served_total: string;
  partner_orgs_count: string;
}

export const useContentStats = () => {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/content-stats' 
        : '/api/content-stats';

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err: any) {
      console.error('Error fetching content stats:', err);
      setError(err.message);
      
      // Fallback to default values if API is not available
      setStats({
        volunteers_count: '0',
        hours_served_total: '0',
        partner_orgs_count: '0'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
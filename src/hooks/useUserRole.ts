import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'pa' | 'faculty' | 'student_leader' | 'admin' | 'user' | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      return;
    }

    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching user role for user:', user.id);
      
      // For custom auth system, user.id is the profile ID, so query profiles table directly
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id) // Use 'id' instead of 'user_id' for custom auth
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error fetching from profiles:', profileError);
        setUserRole('user'); // Default role
      } else if (profileData) {
        console.log('✅ Found role in profiles:', profileData.role);
        setUserRole(profileData.role as UserRole);
      } else {
        console.log('⚠️ No role found, defaulting to user');
        setUserRole('user');
      }
    } catch (error) {
      console.error('❌ Error in fetchUserRole:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const isPA = userRole === 'pa' || userRole === 'faculty' || userRole === 'student_leader' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return {
    userRole,
    loading,
    isPA,
    isAdmin,
    refetchRole: fetchUserRole
  };
};
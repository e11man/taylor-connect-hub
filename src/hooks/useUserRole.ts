import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'pa' | 'admin' | 'user' | null;

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
      
      // Try user_roles table first
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('❌ Error fetching from user_roles:', roleError);
      } else if (roleData) {
        console.log('✅ Found role in user_roles:', roleData.role);
        setUserRole(roleData.role as UserRole);
        setLoading(false);
        return;
      }

      // Fallback to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
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

  const isPA = userRole === 'pa' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return {
    userRole,
    loading,
    isPA,
    isAdmin,
    refetchRole: fetchUserRole
  };
};
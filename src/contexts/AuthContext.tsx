import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserEvents: () => void;
  userEventsRefreshTrigger: number;
  refreshEvents: () => void;
  eventsRefreshTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEventsRefreshTrigger, setUserEventsRefreshTrigger] = useState(0);
  const [eventsRefreshTrigger, setEventsRefreshTrigger] = useState(0);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is an organization or regular user
          console.log('🔍 Checking user status after sign in for:', session.user.email);
          
          try {
            // First check if it's an organization
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('status')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (orgData) {
              // This is an organization - check organization status
              console.log('👔 Organization status:', orgData.status);
              
              if (orgData.status === 'pending') {
                await supabase.auth.signOut();
                toast({
                  title: "Organization Pending Approval",
                  description: "Your organization requires admin approval before access. You'll receive an email when approved.",
                  variant: "destructive",
                });
                return;
              }
              
              if (orgData.status === 'blocked') {
                await supabase.auth.signOut();
                toast({
                  title: "Organization Blocked",
                  description: "Your organization has been blocked. Please contact support.",
                  variant: "destructive",
                });
                return;
              }
              
              if (orgData.status !== 'approved') {
                await supabase.auth.signOut();
                toast({
                  title: "Organization Access Denied",
                  description: `Organization status: ${orgData.status}. Contact admin for assistance.`,
                  variant: "destructive",
                });
                return;
              }
            } else {
              // This is a regular user - check profile status
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('status')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error checking user profile status:', profileError);
                await supabase.auth.signOut();
                return;
              }

              if (profile) {
                console.log('👤 User profile status:', profile.status);
                
                if (profile.status === 'pending') {
                  await supabase.auth.signOut();
                  toast({
                    title: "Account Pending Approval",
                    description: "Your account requires admin approval before access. You'll receive an email when approved.",
                    variant: "destructive",
                  });
                  return;
                }

                if (profile.status === 'blocked') {
                  await supabase.auth.signOut();
                  toast({
                    title: "Account Blocked",
                    description: "Your account has been blocked. Please contact support.",
                    variant: "destructive",
                  });
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error in status check:', error);
            await supabase.auth.signOut();
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Trigger refresh when user state changes
        if (event === 'SIGNED_IN') {
          setUserEventsRefreshTrigger(prev => prev + 1);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUserEvents = () => {
    setUserEventsRefreshTrigger(prev => prev + 1);
  };

  const refreshEvents = () => {
    setEventsRefreshTrigger(prev => prev + 1);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshUserEvents,
    userEventsRefreshTrigger,
    refreshEvents,
    eventsRefreshTrigger,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
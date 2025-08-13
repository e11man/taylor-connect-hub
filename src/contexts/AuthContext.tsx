import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loginUser, registerUser } from '@/utils/directAuth';
import { validateAccessToken, decodeAccessToken } from '@/utils/session';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  user_type: string;
  status: string;
  role?: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: { session: Session }; error?: { message: string } }>;
  signUp: (userData: any) => Promise<{ data?: { session: Session }; error?: { message: string } }>;
  signOut: () => void;
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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session in localStorage
    const existingSession = localStorage.getItem('user_session');
    if (existingSession) {
      try {
        const sessionData = JSON.parse(existingSession);
        // Validate the token
        if (validateAccessToken(sessionData.access_token)) {
          setSession(sessionData);
          setUser(sessionData.user);
        } else {
          // Token expired, remove it
          localStorage.removeItem('user_session');
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        localStorage.removeItem('user_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await loginUser(email, password);
    if (data && data.session.access_token) {
      localStorage.setItem('user_session', JSON.stringify(data.session));
      setSession(data.session);
      setUser(data.session.user);
      setUserEventsRefreshTrigger(prev => prev + 1);
      
      // Redirect all users to their appropriate dashboards
      const userType = data.session.user.user_type;
      const userRole = data.session.user.role;
      const userStatus = data.session.user.status;
      
      // Only redirect if user is active
      if (userStatus === 'active') {
        // Check role first (admin role takes precedence)
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userType === 'organization') {
          navigate('/organization-dashboard');
        } else if (userType === 'student' || userType === 'external') {
          navigate('/dashboard');
        }
      }
    }
    return { data, error };
  };

  const signUp = async (userData: any) => {
    const { data, error } = await registerUser(userData);
    // Don't auto-login after signup - user needs to verify first
    return { data, error };
  };

  const signOut = () => {
    localStorage.removeItem('user_session');
    setSession(null);
    setUser(null);
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
    signIn,
    signUp,
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
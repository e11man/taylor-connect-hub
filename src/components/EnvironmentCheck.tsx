import { useEffect } from 'react';

export const EnvironmentCheck = () => {
  useEffect(() => {
    console.log('Environment Check:', {
      NODE_ENV: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      BASE_URL: import.meta.env.BASE_URL,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      ALL_ENV: import.meta.env
    });
  }, []);
  
  return null;
};
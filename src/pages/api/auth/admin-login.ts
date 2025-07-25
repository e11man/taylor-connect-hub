// API Route for Admin Login
// This route handles admin authentication with proper error handling and RLS bypass

import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client with service role key for admin operations
// IMPORTANT: Only use service role key on server-side, never expose to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '', // This should be set in Vercel environment variables
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Step 1: Authenticate user with regular Supabase client
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: authError?.message 
      });
    }

    // Step 2: Check admin role using service role key (bypasses RLS)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Query with service role key can bypass RLS policies
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      if (roleError) {
        console.error('Role query error:', roleError);
        
        // Try alternative: Check profiles table
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError || profileData?.role !== 'admin') {
          return res.status(403).json({ 
            error: 'Access denied: Admin privileges required',
            hint: 'User does not have admin role in database'
          });
        }
      } else if (!roleData || roleData.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Access denied: Admin privileges required',
          hint: 'User role is not admin'
        });
      }
    } else {
      // Fallback: If no service role key, warn but allow if auth succeeded
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - cannot verify admin role securely');
    }

    // Step 3: Return success with session data
    return res.status(200).json({
      success: true,
      user: authData.user,
      session: authData.session,
      message: 'Admin authentication successful'
    });

  } catch (error: any) {
    console.error('Admin login API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      hint: 'Check server logs and ensure database is properly configured'
    });
  }
}
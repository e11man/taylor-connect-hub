import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword } from './password';
import { generateAccessToken } from './session';

interface UserData {
  email: string;
  password: string;
  user_type: 'student' | 'external' | 'organization';
  dorm?: string;
  wing?: string;
  organization_name?: string;
  description?: string;
  website?: string;
  phone?: string;
}

interface AuthResponse {
  data?: {
    session: {
      user: {
        id: string;
        email: string;
        user_type: string;
        status: string;
      };
      access_token: string;
    };
  };
  error?: {
    message: string;
  };
}

/**
 * Register a new user directly to the profiles table
 * @param userData - User registration data
 * @returns Promise<AuthResponse> - Registration result
 */
export const registerUser = async (userData: UserData): Promise<AuthResponse> => {
  try {
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Determine user status
    const status = userData.email.includes('@taylor.edu') ? 'active' : 'pending';
    
    // Prepare profile data
    const profileData: any = {
      email: userData.email,
      password_hash: hashedPassword,
      user_type: userData.user_type,
      status: status,
      created_at: new Date().toISOString()
    };

    // Add user-specific fields
    if (userData.user_type === 'student' || userData.user_type === 'external') {
      if (userData.dorm) profileData.dorm = userData.dorm;
      if (userData.wing) profileData.wing = userData.wing;
    }

    // Insert into profiles table
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
      
    if (error) {
      return { error: { message: error.message } };
    }

    // If organization, also create organization record
    if (userData.user_type === 'organization') {
      const orgData = {
        user_id: data.id,
        name: userData.organization_name || '',
        description: userData.description || '',
        website: userData.website || '',
        phone: userData.phone || '',
        status: 'pending' // Organizations always need approval
      };

      const { error: orgError } = await supabase
        .from('organizations')
        .insert(orgData);

      if (orgError) {
        // Rollback profile creation if organization creation fails
        await supabase.from('profiles').delete().eq('id', data.id);
        return { error: { message: orgError.message } };
      }
    }
    
    return { data: { session: { user: data, access_token: generateAccessToken(data.id) } } };
  } catch (error) {
    return { error: { message: 'Registration failed. Please try again.' } };
  }
};

/**
 * Login a user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise<AuthResponse> - Login result
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Get user from profiles table
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      return { error: { message: 'Invalid email or password' } };
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return { error: { message: 'Invalid email or password' } };
    }
    
    // Check user status
    if (user.status === 'pending') {
      return { error: { message: 'Account pending approval' } };
    }
    
    if (user.status === 'blocked') {
      return { error: { message: 'Account blocked' } };
    }

    // For organizations, also check organization status
    if (user.user_type === 'organization') {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgData) {
        return { error: { message: 'Organization not found' } };
      }

      if (orgData.status === 'pending') {
        return { error: { message: 'Organization pending approval' } };
      }

      if (orgData.status === 'blocked') {
        return { error: { message: 'Organization blocked' } };
      }

      if (orgData.status !== 'approved') {
        return { error: { message: `Organization status: ${orgData.status}. Contact admin for assistance.` } };
      }
    }
    
    // Create session
    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        status: user.status
      },
      access_token: generateAccessToken(user.id)
    };
    
    return { data: { session } };
  } catch (error) {
    return { error: { message: 'Login failed. Please try again.' } };
  }
};
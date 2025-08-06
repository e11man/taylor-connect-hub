import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword } from './password';
import { generateAccessToken } from './session';
import { sendVerificationCode } from './emailService';

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
        role?: string;
      };
      access_token: string;
    };
  };
  error?: {
    message: string;
  };
}

/**
 * Generate a 6-digit verification code
 */
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};



/**
 * Register a new user directly to the profiles table
 * @param userData - User registration data
 * @returns Promise<AuthResponse> - Registration result
 */
export const registerUser = async (userData: UserData): Promise<AuthResponse> => {
  try {
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Determine user status and verification requirements
    const isTaylorUser = userData.email.includes('@taylor.edu');
    const status = isTaylorUser ? 'pending' : 'pending'; // Both need verification now
    const verificationCode = isTaylorUser ? generateVerificationCode() : null;
    
    // Prepare profile data
    const profileData: any = {
      email: userData.email,
      password_hash: hashedPassword,
      user_type: userData.user_type,
      status: status,
      created_at: new Date().toISOString()
    };

    // Add verification code for Taylor users
    if (verificationCode) {
      profileData.verification_code = verificationCode;
    }

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
        contact_email: userData.email, // Add required contact_email field
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

    // Send verification code for Taylor users
    if (isTaylorUser && verificationCode) {
      console.log('Sending verification code for Taylor user:', userData.email);
      const emailResult = await sendVerificationCode(userData.email, verificationCode);
      console.log('Email sent result:', emailResult);
      if (!emailResult.success) {
        // If email fails, still create the account but warn the user
        console.warn('Failed to send verification email, but account was created');
      }
    }
    
    // Return success but don't auto-login (user needs to verify first)
    return { 
      data: { 
        session: { 
          user: { 
            ...data, 
            status: 'pending' // Always pending until verified
          }, 
          access_token: null // No token until verified
        } 
      } 
    };
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
      .select('id, email, password_hash, user_type, status, role, dorm, wing, verification_code, created_at, updated_at, user_id')
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
    
    // For organizations, check organization status first (not profile status)
    if (user.user_type === 'organization') {
      // For organizations, the user_id in organizations table references the profile id
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

      // If organization is approved, allow login regardless of profile status
      // Update profile status to active to keep it in sync
      await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', user.id);
    } else {
      // For non-organization users, check profile status
      if (user.status === 'pending') {
        // Check if this is a Taylor user who needs verification
        if (user.user_type === 'student' && user.verification_code) {
          return { error: { message: 'EMAIL_VERIFICATION_REQUIRED: Please verify your email address before signing in. Check your email for a verification code.' } };
        }
        return { error: { message: 'Account pending approval' } };
      }
      
      if (user.status === 'blocked') {
        return { error: { message: 'Account blocked' } };
      }
    }
    
    // Create session
    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type || 'student',
        status: user.status,
        role: user.role || 'user' // Include role field for admin authentication
      },
      access_token: generateAccessToken(user.id)
    };
    
    return { data: { session } };
  } catch (error) {
    return { error: { message: 'Login failed. Please try again.' } };
  }
};
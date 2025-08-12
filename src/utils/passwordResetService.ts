import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from './password';

interface PasswordResetResponse {
  success: boolean;
  message: string;
  code?: string;
}

interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
  userId?: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

export const sendPasswordResetCode = async (email: string): Promise<PasswordResetResponse> => {
  try {
    // Call the Vercel API route to send the reset email
    const response = await fetch('/api/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: 'Password reset code sent to your email.',
        code: result.code // For testing purposes
      };
    } else {
      return {
        success: false,
        message: result.message || result.error || 'Failed to send password reset code.'
      };
    }
  } catch (error) {
    console.error('Error sending password reset code:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

export const verifyResetCode = async (email: string, code: string): Promise<VerifyResetCodeResponse> => {
  try {
    // Call the Vercel API route to verify the reset code
    const response = await fetch('/api/verify-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: 'Reset code verified successfully.',
        userId: null // We'll get this from the API if needed
      };
    } else {
      return {
        success: false,
        message: result.message || result.error || 'Invalid or expired reset code.'
      };
    }
  } catch (error) {
    console.error('Error verifying reset code:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

export const updatePasswordWithResetCode = async (
  email: string, 
  code: string, 
  newPassword: string
): Promise<UpdatePasswordResponse> => {
  try {
    // Call the Vercel API route to update the password
    const response = await fetch('/api/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: 'Password updated successfully!'
      };
    } else {
      return {
        success: false,
        message: result.message || result.error || 'Failed to update password. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Alternative method using RPC functions if available
export const updatePasswordWithResetCodeRPC = async (
  email: string, 
  code: string, 
  newPassword: string
): Promise<UpdatePasswordResponse> => {
  try {
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Call RPC function to update password with reset code
    const { data, error } = await supabase.rpc('update_password_with_reset_code', {
      p_email: email,
      p_reset_code: code,
      p_new_password_hash: hashedPassword
    });

    if (error) {
      console.error('RPC error:', error);
      return {
        success: false,
        message: 'Failed to update password. Please try again.'
      };
    }

    if (data) {
      return {
        success: true,
        message: 'Password updated successfully!'
      };
    } else {
      return {
        success: false,
        message: 'Invalid or expired reset code.'
      };
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}; 
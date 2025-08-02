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
    // First, check if the user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return {
        success: false,
        message: 'No account found with this email address.'
      };
    }

    // Call the Python script to send the reset email
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
        message: result.message || 'Failed to send password reset code.'
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
    // Check if the code is valid and not expired
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, verification_code, updated_at')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: 'Invalid or expired reset code.'
      };
    }

    // Check if the code has expired (10 minutes)
    const codeTime = new Date(user.updated_at);
    const now = new Date();
    const timeDiff = now.getTime() - codeTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 10) {
      return {
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      };
    }

    return {
      success: true,
      message: 'Reset code verified successfully.',
      userId: user.id
    };
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
    // First verify the reset code
    const verifyResult = await verifyResetCode(email, code);
    if (!verifyResult.success) {
      return {
        success: false,
        message: verifyResult.message
      };
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password in the database
    const { error } = await supabase
      .from('profiles')
      .update({ 
        password_hash: hashedPassword,
        verification_code: null, // Clear the reset code
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.error('Error updating password:', error);
      return {
        success: false,
        message: 'Failed to update password. Please try again.'
      };
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    };
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
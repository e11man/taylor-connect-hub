import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export const sendOrganizationPasswordResetCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // First check if this email exists and is an organization account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('email', email)
      .eq('user_type', 'organization')
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'No organization account found with this email address.' };
    }

    // Call the backend API to send the reset code
    const response = await fetch('/api/send-organization-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to send reset code' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending organization password reset code:', error);
    return { success: false, error: 'Failed to send reset code' };
  }
};

export const verifyOrganizationResetCode = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, verification_code, updated_at')
      .eq('email', email)
      .eq('user_type', 'organization')
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid email address' };
    }

    // Check if code matches and hasn't expired (10 minutes)
    const codeExpiration = new Date(data.updated_at);
    codeExpiration.setMinutes(codeExpiration.getMinutes() + 10);
    
    if (data.verification_code !== code || new Date() > codeExpiration) {
      return { success: false, error: 'Invalid or expired reset code' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying organization reset code:', error);
    return { success: false, error: 'Failed to verify reset code' };
  }
};

export const updateOrganizationPasswordWithResetCode = async (
  email: string, 
  code: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First verify the code
    const verifyResult = await verifyOrganizationResetCode(email, code);
    if (!verifyResult.success) {
      return verifyResult;
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const { error } = await supabase
      .from('profiles')
      .update({ 
        password_hash: hashedPassword,
        verification_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('user_type', 'organization');

    if (error) {
      console.error('Error updating organization password:', error);
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating organization password:', error);
    return { success: false, error: 'Failed to update password' };
  }
};

// Alternative RPC function for password update (if needed)
export const updateOrganizationPasswordWithResetCodeRPC = async (
  email: string, 
  code: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Call the RPC function
    const { error } = await supabase.rpc('update_organization_password_with_reset_code', {
      p_email: email,
      p_reset_code: code,
      p_new_password_hash: hashedPassword
    });

    if (error) {
      console.error('Error updating organization password via RPC:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating organization password via RPC:', error);
    return { success: false, error: 'Failed to update password' };
  }
}; 
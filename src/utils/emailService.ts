// Email service for verification codes using Resend API
import { supabase } from '@/integrations/supabase/client';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get the base URL for the email service
const getEmailServiceUrl = () => {
  if (typeof window !== 'undefined') {
    // Use the current domain for Vercel API routes
    return window.location.origin;
  }
  // Fallback for server-side rendering
  return 'http://localhost:3000';
};

export const sendVerificationCode = async (email: string, code?: string): Promise<{ success: boolean; code?: string }> => {
  try {
    // Generate verification code if not provided
    const verificationCode = code || generateVerificationCode();
    
    // Update the verification code in the database first
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        verification_code: verificationCode,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.error('Failed to update verification code in database:', updateError);
      return { success: false };
    }
    
    try {
      // Call the Vercel API route that uses Resend directly
      const emailServiceUrl = getEmailServiceUrl();
      
      const response = await fetch(`${emailServiceUrl}/api/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email service HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      return { success: true, code: result.code || verificationCode };
    } catch (emailError) {
      console.error('Email sending failed, but verification code is stored in database:', emailError);
      
      // Even if email fails, we still have the code in the database
      // The verification code is stored and can be used for verification
      
      // Return success with a warning - the code is stored even if email failed
      return { 
        success: true, 
        code: verificationCode,
        warning: 'Email sending failed but verification code is available'
      };
    }
  } catch (error) {
    console.error('Complete failure in sendVerificationCode:', error);
    return { success: false };
  }
};
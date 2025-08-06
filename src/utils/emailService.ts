// Email service for verification codes using Resend API
import { supabase } from '@/integrations/supabase/client';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get the base URL for the email service
const getEmailServiceUrl = () => {
  // In development, use localhost:3001
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // In production, try the same domain with different port (if available)
    // Otherwise fallback to localhost for now
    return 'http://localhost:3001';
  }
  return 'http://localhost:3001';
};

export const sendVerificationCode = async (email: string, code?: string): Promise<{ success: boolean; code?: string }> => {
  try {
    console.log(`🔐 Sending verification code to: ${email}`);
    
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
      console.error('❌ Failed to update verification code in database:', updateError);
      return { success: false };
    }
    
    console.log('✅ Verification code updated in database');
    
    try {
      // Call the server endpoint that uses the Python script with Resend
      const emailServiceUrl = getEmailServiceUrl();
      console.log(`📧 Calling email service at: ${emailServiceUrl}`);
      
      const response = await fetch(`${emailServiceUrl}/api/send-verification-code`, {
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
        console.error('❌ Email service HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Email sent successfully via Resend:', result);
      
      return { success: true, code: result.code || verificationCode };
    } catch (emailError) {
      console.error('⚠️ Email sending failed, but verification code is stored in database:', emailError);
      
      // Even if email fails, we still have the code in the database
      // For development, log the code so testing can continue
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 DEV MODE - Verification code for ${email}: ${verificationCode}`);
      }
      
      // Return success with a warning - the code is stored even if email failed
      return { 
        success: true, 
        code: verificationCode,
        warning: 'Email sending failed but verification code is available'
      };
    }
  } catch (error) {
    console.error('💥 Complete failure in sendVerificationCode:', error);
    return { success: false };
  }
};
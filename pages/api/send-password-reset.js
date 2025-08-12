import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Sending password reset code to:', email);

    // First, check if the user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'No account found with this email address.' 
      });
    }

    // Generate a 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Update the profiles table with reset code and expiration
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        verification_code: resetCode, 
        updated_at: expiresAt 
      })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating profiles table:', updateError);
      return res.status(500).json({ 
        error: 'Failed to generate reset code. Please try again.' 
      });
    }

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Resend API key not configured');
      return res.status(500).json({ 
        error: 'Email service not configured. Please contact support.' 
      });
    }

    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Community Connect <noreply@ellmangroup.org>',
          to: [email],
          subject: 'Reset Your Community Connect Password',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 10px;">Reset Your Password</h1>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; margin-bottom: 20px;">
                <p style="color: #666; font-size: 16px; margin-bottom: 24px; text-align: center;">
                  Use this code to reset your password:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <div style="display: inline-block; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px;">
                    <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1a1a1a;">
                      ${resetCode}
                    </div>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin-top: 24px;">
                  This code will expire in 10 minutes.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  Community Connect - Connecting volunteers with meaningful opportunities
                </p>
              </div>
            </div>
          `
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Resend API error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to send email. Please try again.' 
        });
      }

      console.log('Password reset email sent successfully');
      res.json({ 
        success: true, 
        message: 'Password reset code sent successfully',
        code: resetCode // For testing purposes
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send email. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

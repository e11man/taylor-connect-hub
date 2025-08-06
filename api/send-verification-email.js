// Vercel serverless function for sending verification emails
import { Resend } from 'resend';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate code if not provided
    const verificationCode = code || Math.floor(100000 + Math.random() * 900000).toString();

    console.log('Sending verification email to:', email);

    // Initialize Resend with API key from environment variables
    const resend = new Resend(process.env.RESEND_API_KEY || 're_e32x6j2U_Mx5KLTyeAW5oBVYPftpDnH92');

    // Send the email using Resend
    const emailResult = await resend.emails.send({
      from: 'Taylor Connect <noreply@ellmangroup.org>',
      to: [email],
      subject: 'Verify Your Taylor Connect Hub Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00AFCE 0%, #0077B6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Taylor Connect Hub</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Account Verification</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for creating your Taylor Connect Hub account! To complete your registration, please enter the verification code below:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #00AFCE; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Your 6-digit verification code</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Enter this code in the verification screen to activate your account. This code will expire in 10 minutes.
            </p>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #00AFCE; margin: 20px 0;">
              <p style="color: #0056b3; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> Never share this code with anyone. Taylor Connect Hub will never ask for this code via phone or email.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 25px; font-size: 14px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Taylor Connect Hub. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      `
    });

    console.log('Email sent successfully:', emailResult);

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent successfully',
      code: verificationCode
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({ 
      error: 'Failed to send verification email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
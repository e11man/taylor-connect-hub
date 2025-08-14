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
      from: 'Main Street Connect <noreply@uplandmainstreet.org>',
      to: [email],
      subject: 'Verify Your Main Street Connect Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1B365F; margin: 0; font-size: 28px; font-weight: 600;">Main Street Connect</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Account Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for creating your Main Street Connect account!
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your verification code is: <strong style="color: #E14F3D; font-size: 18px;">${verificationCode}</strong>
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Enter this code to complete your registration. This code expires in 10 minutes.
            </p>
            
            <div style="background: #E14F3D; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: 600;">Verification Code: ${verificationCode}</p>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">If you didn't create this account, you can safely ignore this email.</p>
          </div>
          
          <div style="border-top: 2px solid #E14F3D; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #1B365F; margin: 0; font-size: 18px; font-weight: 600;">Main Street Connect</p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Connecting communities through meaningful volunteer opportunities</p>
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
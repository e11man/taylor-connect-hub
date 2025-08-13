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
      from: 'acme <noreply@uplandmainstreet.org>',
      to: [email],
      subject: 'Verify Your acme Account',
      html: `
        <p>acme - Account Verification</p>
        <p>Thank you for creating your acme account!</p>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>Enter this code to complete your registration. This code expires in 10 minutes.</p>
        <p>If you didn't create this account, you can ignore this email.</p>
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
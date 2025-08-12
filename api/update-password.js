import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables for update-password');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('Updating password for:', email);

    // First verify the reset code
    const { data: user, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, verification_code, updated_at')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (verifyError || !user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset code.' 
      });
    }

    // Check if the code has expired (10 minutes)
    const codeTime = new Date(user.updated_at);
    const now = new Date();
    const timeDiff = now.getTime() - codeTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 10) {
      return res.status(400).json({ 
        error: 'Reset code has expired. Please request a new one.' 
      });
    }

    // Hash the new password (using bcryptjs for better compatibility)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password and clear the reset code
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        password_hash: hashedPassword,
        verification_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update password. Please try again.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Password updated successfully!' 
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

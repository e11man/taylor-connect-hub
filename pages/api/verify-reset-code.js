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
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    console.log('Verifying reset code for:', email);

    // Check if the reset code matches and hasn't expired
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, verification_code, updated_at')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !user) {
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

    res.json({ 
      success: true, 
      message: 'Reset code verified successfully' 
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

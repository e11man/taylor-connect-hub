import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const port = 3001;

// Supabase client for content management
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Local email endpoint for development using Resend
app.post('/api/local-notify-signup', async (req, res) => {
  try {
    const { signups } = req.body;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    if (!signups || !Array.isArray(signups) || signups.length === 0) {
      return res.status(400).json({ error: 'No signups provided' });
    }

    const resend = new Resend(RESEND_API_KEY);
    const FROM = 'Main Street Connect <noreply@uplandmainstreet.org>';

    const buildHtml = (s) => `<!doctype html><html><body><div style="font-family:Arial,sans-serif;padding:16px">` +
      `<h2 style="margin:0 0 12px 0">Event Signup Confirmation</h2>` +
      `<p>You have been signed up for <strong>${s.eventName}</strong> by <strong>${s.signedUpBy}</strong>.</p>` +
      `</div></body></html>`;

    const results = await Promise.allSettled(signups.map(async (s) => {
      if (!s.email) return { success: false, reason: 'No email' };
      const resp = await resend.emails.send({
        from: FROM,
        to: [s.email],
        subject: `You've been signed up for: ${s.eventName}`,
        html: buildHtml(s)
      });
      if (resp.error) return { success: false, reason: resp.error };
      return { success: true };
    }));

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;
    const status = failed > 0 ? 207 : 200;
    return res.status(status).json({ sent, failed, total: results.length });
  } catch (err) {
    console.error('local-notify-signup error', err);
    return res.status(500).json({ error: 'Failed to send emails', details: err.message });
  }
});

// Email sending endpoint using Python script
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Sending verification code to:', email);

    // Call the Python script
    const pythonScriptPath = path.join(process.cwd(), 'email-service', 'send_verification_email.py');
    
    return new Promise((resolve, reject) => {
      // If code is provided, pass it to the Python script, otherwise let it generate one
      const args = code ? [pythonScriptPath, email, code] : [pythonScriptPath, email];
      
      // Set up environment to use the virtual environment
      const env = { ...process.env };
      const venvPath = path.join(process.cwd(), 'email-service', 'venv');
      env.PYTHONPATH = path.join(venvPath, 'lib', 'python3.13', 'site-packages');
      env.VIRTUAL_ENV = venvPath;
      env.PATH = path.join(venvPath, 'bin') + ':' + env.PATH;
      
      // Use the virtual environment's Python directly
      const venvPythonPath = path.join(venvPath, 'bin', 'python');
      const pythonProcess = spawn(venvPythonPath, args, { env });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Extract the verification code from the output
          const codeMatch = output.match(/CODE:(\d{6})/);
          const sentCode = codeMatch ? codeMatch[1] : code;
          
          console.log('Email sent successfully via Python script');
          res.json({ 
            success: true, 
            message: 'Verification code sent successfully',
            code: sentCode
          });
          resolve();
        } else {
          console.error('Python script error:', errorOutput);
          res.status(500).json({ 
            error: 'Failed to send verification email',
            details: errorOutput
          });
          reject();
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        res.status(500).json({ 
          error: 'Failed to start email service',
          details: error.message
        });
        reject();
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Password reset endpoint using Supabase client and Python script for email
app.post('/api/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Sending password reset code to:', email);

    // First, check if the user exists and generate reset code
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

    // Call the Python script only for sending the email
    const pythonScriptPath = path.join(process.cwd(), 'email-service', 'send_password_reset_email.py');
    
    return new Promise((resolve, reject) => {
      const args = [pythonScriptPath, email, resetCode];
      
      // Set up environment to use the virtual environment
      const env = { ...process.env };
      const venvPath = path.join(process.cwd(), 'email-service', 'venv');
      env.PYTHONPATH = path.join(venvPath, 'lib', 'python3.13', 'site-packages');
      env.VIRTUAL_ENV = venvPath;
      env.PATH = path.join(venvPath, 'bin') + ':' + env.PATH;
      
      // Use the virtual environment's Python directly
      const venvPythonPath = path.join(venvPath, 'bin', 'python');
      const pythonProcess = spawn(venvPythonPath, args, { env });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Password reset email sent successfully via Python script');
          res.json({ 
            success: true, 
            message: 'Password reset code sent successfully',
            code: resetCode // For testing purposes
          });
          resolve();
        } else {
          console.error('Python script error:', errorOutput);
          res.status(500).json({ 
            error: 'Failed to send password reset email',
            details: errorOutput
          });
          reject();
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        res.status(500).json({ 
          error: 'Failed to start email service',
          details: error.message
        });
        reject();
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset verification endpoint
app.post('/api/verify-reset-code', async (req, res) => {
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
});

// Password update endpoint
app.post('/api/update-password', async (req, res) => {
  try {
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

    // Hash the new password (using bcrypt)
    const bcrypt = require('bcrypt');
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
});

// Manual chat notification processing has been removed
// Notifications are now processed automatically via Supabase Edge Functions
// The system uses:
// 1. Database triggers to create notifications when chat messages are posted
// 2. A cron function (process-notifications-cron) that runs every 5 minutes
// 3. The send-chat-notifications Edge Function for actual email delivery

// Admin approval endpoints
app.post('/api/admin/approve-organization', async (req, res) => {
  try {
    const { organizationId, adminId } = req.body;

    if (!organizationId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: organizationId, adminId' 
      });
    }

    console.log('Approving organization:', organizationId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    console.log('Admin check result:', { adminCheck, adminError });

    if (adminError || !adminCheck) {
      console.log('Admin check failed:', { adminError, adminCheck });
      return res.status(403).json({ 
        error: 'Only admins can approve organizations' 
      });
    }

    // Get the profile ID for the admin user
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', adminId)
      .single();

    if (profileError || !adminProfile) {
      console.error('Error getting admin profile:', profileError);
      return res.status(500).json({ 
        error: 'Failed to get admin profile',
        details: profileError?.message
      });
    }

    // Update organization status
    console.log('Updating organization with ID:', organizationId);
    
    const { data: org, error: updateError } = await supabase
      .from('organizations')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminProfile.id, // Use profiles.id instead of user_id
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ 
        error: 'Failed to approve organization',
        details: updateError.message
      });
    }

    // Also update the corresponding profile status to active
    console.log('Updating profile status for organization user');
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', organization.user_id);

    if (profileUpdateError) {
      console.error('Error updating profile status:', profileUpdateError);
      // Don't fail the whole operation, just log the error
      // The login function will handle this case
    }

    console.log('Organization update result:', { org, updateError });

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ 
        error: 'Failed to approve organization',
        details: updateError.message
      });
    }

    console.log('Organization approved successfully:', org.name);
    res.json({ 
      success: true, 
      message: 'Organization approved successfully',
      organization: org
    });

  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.post('/api/admin/reject-organization', async (req, res) => {
  try {
    const { organizationId, adminId, reason } = req.body;

    if (!organizationId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: organizationId, adminId' 
      });
    }

    console.log('Rejecting organization:', organizationId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      return res.status(403).json({ 
        error: 'Only admins can reject organizations' 
      });
    }

    // Get the profile ID for the admin user
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', adminId)
      .single();

    if (profileError || !adminProfile) {
      console.error('Error getting admin profile:', profileError);
      return res.status(500).json({ 
        error: 'Failed to get admin profile',
        details: profileError?.message
      });
    }

    // Update organization status
    const { data: org, error: updateError } = await supabase
      .from('organizations')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ 
        error: 'Failed to reject organization',
        details: updateError.message
      });
    }

    console.log('Organization rejected successfully:', org.name);
    res.json({ 
      success: true, 
      message: 'Organization rejected successfully',
      organization: org
    });

  } catch (error) {
    console.error('Admin rejection error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.post('/api/admin/approve-user', async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, adminId' 
      });
    }

    console.log('Approving user:', userId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      return res.status(403).json({ 
        error: 'Only admins can approve users' 
      });
    }

    // Update user status
    const { data: user, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ 
        error: 'Failed to approve user',
        details: updateError.message
      });
    }

    console.log('User approved successfully:', user.email);
    res.json({ 
      success: true, 
      message: 'User approved successfully',
      user: user
    });

  } catch (error) {
    console.error('Admin user approval error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.post('/api/admin/reject-user', async (req, res) => {
  try {
    const { userId, adminId, reason } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, adminId' 
      });
    }

    console.log('Rejecting user:', userId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      return res.status(403).json({ 
        error: 'Only admins can reject users' 
      });
    }

    // Update user status
    const { data: user, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'blocked',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ 
        error: 'Failed to reject user',
        details: updateError.message
      });
    }

    console.log('User rejected successfully:', user.email);
    res.json({ 
      success: true, 
      message: 'User rejected successfully',
      user: user
    });

  } catch (error) {
    console.error('Admin user rejection error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Comprehensive organization deletion endpoint
app.delete('/api/admin/delete-organization', async (req, res) => {
  try {
    const { organizationId, adminId } = req.body;

    if (!organizationId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: organizationId, adminId' 
      });
    }

    console.log('Deleting organization:', organizationId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      return res.status(403).json({ 
        error: 'Only admins can delete organizations' 
      });
    }

    // Get organization details first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('user_id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ 
        error: 'Organization not found' 
      });
    }

    console.log('Deleting organization:', organization.name, 'with user_id:', organization.user_id);

    // Start transaction-like deletion process
    // 1. Delete all user_events for events by this organization
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('organization_id', organizationId);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return res.status(500).json({ 
        error: 'Failed to fetch organization events',
        details: eventsError.message
      });
    }

    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      console.log('Deleting user_events for events:', eventIds);
      
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .in('event_id', eventIds);

      if (userEventsError) {
        console.error('Error deleting user_events:', userEventsError);
        return res.status(500).json({ 
          error: 'Failed to delete user event signups',
          details: userEventsError.message
        });
      }
    }

    // 2. Delete all events by this organization
    console.log('Deleting events for organization');
    const { error: deleteEventsError } = await supabase
      .from('events')
      .delete()
      .eq('organization_id', organizationId);

    if (deleteEventsError) {
      console.error('Error deleting events:', deleteEventsError);
      return res.status(500).json({ 
        error: 'Failed to delete organization events',
        details: deleteEventsError.message
      });
    }

    // 3. Delete user_roles for the organization user
    console.log('Deleting user_roles for organization user');
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', organization.user_id);

    if (deleteRolesError) {
      console.error('Error deleting user_roles:', deleteRolesError);
      return res.status(500).json({ 
        error: 'Failed to delete user roles',
        details: deleteRolesError.message
      });
    }

    // 4. Delete the organization
    console.log('Deleting organization record');
    const { error: deleteOrgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (deleteOrgError) {
      console.error('Error deleting organization:', deleteOrgError);
      return res.status(500).json({ 
        error: 'Failed to delete organization',
        details: deleteOrgError.message
      });
    }

    // 5. Delete the user profile
    console.log('Deleting user profile');
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', organization.user_id);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return res.status(500).json({ 
        error: 'Failed to delete user profile',
        details: deleteProfileError.message
      });
    }

    console.log('Organization deletion completed successfully');
    res.json({ 
      success: true, 
      message: 'Organization and all related data deleted successfully',
      deletedOrganization: organization.name
    });

  } catch (error) {
    console.error('Organization deletion error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Comprehensive user deletion endpoint
app.delete('/api/admin/delete-user', async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, adminId' 
      });
    }

    console.log('Deleting user:', userId, 'by admin:', adminId);

    // Check if user is admin using profiles table
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      return res.status(403).json({ 
        error: 'Only admins can delete users' 
      });
    }

    // Get user details first
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('user_id, email, user_type')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    console.log('Deleting user:', userProfile.email, 'with user_id:', userProfile.user_id);

    // If user_id is null, this is a direct auth user - use the profile id as user_id
    const effectiveUserId = userProfile.user_id || userId;

    // Start transaction-like deletion process
    // 1. Delete all user_events for this user (only if user_id exists)
    if (userProfile.user_id) {
      console.log('Deleting user_events for user');
      const { error: userEventsError } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', userProfile.user_id);

      if (userEventsError) {
        console.error('Error deleting user_events:', userEventsError);
        return res.status(500).json({ 
          error: 'Failed to delete user event signups',
          details: userEventsError.message
        });
      }
    } else {
      console.log('Skipping user_events deletion - no user_id');
    }

    // 2. If user is an organization, delete their events and organization
    if (userProfile.user_type === 'organization') {
      // Get organization ID
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', effectiveUserId)
        .single();

      if (!orgError && org) {
        // Delete all user_events for events by this organization
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('organization_id', org.id);

        if (!eventsError && events && events.length > 0) {
          const eventIds = events.map(e => e.id);
          console.log('Deleting user_events for organization events:', eventIds);
          
          const { error: orgUserEventsError } = await supabase
            .from('user_events')
            .delete()
            .in('event_id', eventIds);

          if (orgUserEventsError) {
            console.error('Error deleting organization user_events:', orgUserEventsError);
            return res.status(500).json({ 
              error: 'Failed to delete organization event signups',
              details: orgUserEventsError.message
            });
          }
        }

        // Delete all events by this organization
        console.log('Deleting organization events');
        const { error: deleteEventsError } = await supabase
          .from('events')
          .delete()
          .eq('organization_id', org.id);

        if (deleteEventsError) {
          console.error('Error deleting organization events:', deleteEventsError);
          return res.status(500).json({ 
            error: 'Failed to delete organization events',
            details: deleteEventsError.message
          });
        }

        // Delete the organization
        console.log('Deleting organization record');
        const { error: deleteOrgError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', org.id);

        if (deleteOrgError) {
          console.error('Error deleting organization:', deleteOrgError);
          return res.status(500).json({ 
            error: 'Failed to delete organization',
            details: deleteOrgError.message
          });
        }
      }
    }

    // 3. Delete user_roles for the user (only if user_id exists)
    if (userProfile.user_id) {
      console.log('Deleting user_roles for user');
      const { error: deleteRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userProfile.user_id);

      if (deleteRolesError) {
        console.error('Error deleting user_roles:', deleteRolesError);
        return res.status(500).json({ 
          error: 'Failed to delete user roles',
          details: deleteRolesError.message
        });
      }
    } else {
      console.log('Skipping user_roles deletion - no user_id');
    }

    // 4. Delete the user profile
    console.log('Deleting user profile');
    let deleteProfileError;
    if (userProfile.user_id) {
      // If user_id exists, delete by user_id
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userProfile.user_id);
      deleteProfileError = error;
    } else {
      // If user_id is null, delete by profile id
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      deleteProfileError = error;
    }

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return res.status(500).json({ 
        error: 'Failed to delete user profile',
        details: deleteProfileError.message
      });
    }

    console.log('User deletion completed successfully');
    res.json({ 
      success: true, 
      message: 'User and all related data deleted successfully',
      deletedUser: userProfile.email
    });

  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Scheduled user decommitment function for expired events
const performEventCleanup = async () => {
  try {
    console.log('🔄 Starting scheduled user decommitment from expired events...');
    
    // Find events that ended more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Use a comprehensive query to get all events with calculated end times
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select(`
        id, 
        title, 
        date,
        estimated_end_time,
        event_series!inner(
          end_time
        )
      `);

    if (fetchError) {
      console.error('❌ Error fetching events:', fetchError);
      return;
    }

    // Also get events without series
    const { data: standaloneEvents, error: standaloneError } = await supabase
      .from('events')
      .select('id, title, date, estimated_end_time')
      .is('series_id', null);

    if (standaloneError) {
      console.error('❌ Error fetching standalone events:', standaloneError);
      return;
    }

    // Combine and filter expired events
    const combinedEvents = [...(allEvents || []), ...(standaloneEvents || [])];
    const expiredEvents = [];

    for (const event of combinedEvents) {
      let eventEndTime = null;
      
      // Priority 1: Use estimated_end_time if available
      if (event.estimated_end_time) {
        eventEndTime = new Date(event.estimated_end_time);
      }
      // Priority 2: Calculate from date + series end_time
      else if (event.event_series && event.event_series.end_time && event.date) {
        const eventDate = new Date(event.date);
        const [hours, minutes] = event.event_series.end_time.split(':');
        eventEndTime = new Date(eventDate);
        eventEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      // Priority 3: Use date + 2 hours as default
      else if (event.date) {
        eventEndTime = new Date(event.date);
        eventEndTime.setHours(eventEndTime.getHours() + 2);
      }
      
      // Check if event ended more than 1 hour ago
      if (eventEndTime && eventEndTime < new Date(oneHourAgo)) {
        expiredEvents.push({
          ...event,
          calculated_end_time: eventEndTime.toISOString()
        });
      }
    }

    if (expiredEvents.length === 0) {
      console.log('✅ No expired events found');
      return;
    }

    console.log(`🔍 Found ${expiredEvents.length} expired events to check for signups`);

    let totalDecommittedUsers = 0;
    let processedEvents = 0;
    const errors = [];

    for (const event of expiredEvents) {
      try {
        // Check if this event has any active signups
        const { data: signups, error: signupError } = await supabase
          .from('user_events')
          .select('id, user_id')
          .eq('event_id', event.id);

        if (signupError) {
          console.error(`❌ Error checking signups for event ${event.id}:`, signupError);
          errors.push(`Signup check failed for ${event.title}: ${signupError.message}`);
          continue;
        }

        if (!signups || signups.length === 0) {
          console.log(`ℹ️ Event "${event.title}" has no active signups`);
          continue;
        }

        console.log(`👥 Decommitting ${signups.length} users from expired event: ${event.title} (ended at ${event.calculated_end_time})`);

        // Remove all signups for this expired event
        const { error: deleteError } = await supabase
          .from('user_events')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) {
          console.error(`❌ Error decommitting users from event ${event.id}:`, deleteError);
          errors.push(`User decommitment failed for ${event.title}: ${deleteError.message}`);
          continue;
        }

        console.log(`✅ Successfully decommitted ${signups.length} users from event: ${event.title}`);
        totalDecommittedUsers += signups.length;
        processedEvents++;

      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
        errors.push(`Processing failed for ${event.title}: ${error.message}`);
      }
    }

    console.log(`🎉 User decommitment completed. Decommitted ${totalDecommittedUsers} users from ${processedEvents} expired events.`);
    
    if (errors.length > 0) {
      console.error('⚠️ Errors during decommitment:', errors);
    }
    
  } catch (error) {
    console.error('❌ User decommitment error:', error);
  }
};

// Run cleanup every hour
setInterval(performEventCleanup, 60 * 60 * 1000); // 1 hour

// Also run cleanup on server start
setTimeout(performEventCleanup, 5000); // Run 5 seconds after server start

// User decommitment endpoint - removes user signups from events that ended more than 1 hour ago
app.post('/api/cleanup-events', async (req, res) => {
  try {
    console.log('Starting user decommitment from expired events...');
    
    // Find events that ended more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Use a comprehensive query to get all events with calculated end times
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select(`
        id, 
        title, 
        date,
        estimated_end_time,
        event_series!inner(
          end_time
        )
      `);

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
      return res.status(500).json({ 
        error: 'Failed to fetch events',
        details: fetchError.message
      });
    }

    // Also get events without series
    const { data: standaloneEvents, error: standaloneError } = await supabase
      .from('events')
      .select('id, title, date, estimated_end_time')
      .is('series_id', null);

    if (standaloneError) {
      console.error('Error fetching standalone events:', standaloneError);
      return res.status(500).json({ 
        error: 'Failed to fetch standalone events',
        details: standaloneError.message
      });
    }

    // Combine and filter expired events
    const combinedEvents = [...(allEvents || []), ...(standaloneEvents || [])];
    const expiredEvents = [];

    for (const event of combinedEvents) {
      let eventEndTime = null;
      
      // Priority 1: Use estimated_end_time if available
      if (event.estimated_end_time) {
        eventEndTime = new Date(event.estimated_end_time);
      }
      // Priority 2: Calculate from date + series end_time
      else if (event.event_series && event.event_series.end_time && event.date) {
        const eventDate = new Date(event.date);
        const [hours, minutes] = event.event_series.end_time.split(':');
        eventEndTime = new Date(eventDate);
        eventEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      // Priority 3: Use date + 2 hours as default
      else if (event.date) {
        eventEndTime = new Date(event.date);
        eventEndTime.setHours(eventEndTime.getHours() + 2);
      }
      
      // Check if event ended more than 1 hour ago
      if (eventEndTime && eventEndTime < new Date(oneHourAgo)) {
        expiredEvents.push({
          ...event,
          calculated_end_time: eventEndTime.toISOString()
        });
      }
    }

    if (expiredEvents.length === 0) {
      console.log('No expired events found');
      return res.json({ 
        success: true, 
        message: 'No expired events found',
        decommittedUsers: 0,
        processedEvents: 0,
        totalEventsChecked: combinedEvents.length
      });
    }

    let totalDecommittedUsers = 0;
    let processedEvents = 0;
    const errors = [];
    const eventDetails = [];

    for (const event of expiredEvents) {
      try {
        // Check if this event has any active signups
        const { data: signups, error: signupError } = await supabase
          .from('user_events')
          .select('id, user_id')
          .eq('event_id', event.id);

        if (signupError) {
          console.error(`Error checking signups for event ${event.id}:`, signupError);
          errors.push(`Signup check failed for ${event.title}: ${signupError.message}`);
          continue;
        }

        if (!signups || signups.length === 0) {
          console.log(`Event "${event.title}" has no active signups`);
          continue;
        }

        console.log(`Decommitting ${signups.length} users from expired event: ${event.title} (ended at ${event.calculated_end_time})`);

        // Remove all signups for this expired event
        const { error: deleteError } = await supabase
          .from('user_events')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) {
          console.error(`Error decommitting users from event ${event.id}:`, deleteError);
          errors.push(`User decommitment failed for ${event.title}: ${deleteError.message}`);
          continue;
        }

        console.log(`Successfully decommitted ${signups.length} users from event: ${event.title}`);
        totalDecommittedUsers += signups.length;
        processedEvents++;
        
        eventDetails.push({
          eventId: event.id,
          eventTitle: event.title,
          eventEndTime: event.calculated_end_time,
          decommittedUsersCount: signups.length
        });

      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errors.push(`Processing failed for ${event.title}: ${error.message}`);
      }
    }

    console.log(`User decommitment completed. Decommitted ${totalDecommittedUsers} users from ${processedEvents} expired events.`);
    
    res.json({ 
      success: true, 
      message: `User decommitment completed. Decommitted ${totalDecommittedUsers} users from ${processedEvents} expired events.`,
      decommittedUsers: totalDecommittedUsers,
      processedEvents,
      totalExpiredEvents: expiredEvents.length,
      totalEventsChecked: combinedEvents.length,
      eventDetails,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in decommitment endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error during user decommitment',
      details: error.message
    });
  }
});

// Contact form endpoint
app.post('/api/contact-form', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    console.log('Sending contact form email from:', name, email);

    // Call the contact form handler script
    const pythonScriptPath = path.join(process.cwd(), 'database-service', 'contact_form_handler.py');
    
    return new Promise((resolve) => {
      // Set up environment to use the virtual environment
      const env = { ...process.env };
      const venvPath = path.join(process.cwd(), 'database-service', 'venv');
      env.VIRTUAL_ENV = venvPath;
      env.PATH = path.join(venvPath, 'bin') + ':' + env.PATH;
      
      // Use the virtual environment's Python directly
      const venvPythonPath = path.join(venvPath, 'bin', 'python');
      const pythonProcess = spawn(venvPythonPath, [
        pythonScriptPath, 
        'send', 
        name, 
        email, 
        message,
        '--production'
      ], { env });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Contact form email sent successfully via Python script');
          res.json({ 
            success: true, 
            message: 'Contact form submitted successfully' 
          });
          resolve();
        } else {
          console.error('Contact form handler error:', errorOutput);
          res.status(500).json({ 
            error: 'Failed to send contact form email',
            details: errorOutput
          });
          resolve();
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start contact form handler:', error);
        res.status(500).json({ 
          error: 'Failed to process contact form' 
        });
        resolve();
      });
    });

  } catch (error) {
    console.error('Contact form API error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Content management API routes
app.get('/api/content', async (req, res) => {
  try {
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .order('page')
      .order('section')
      .order('key');

    if (error) throw error;
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const { page, section, key, value, language_code = 'en' } = req.body;
    
    if (!page || !section || !key || !value) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: newContent, error } = await supabase
      .from('content')
      .insert({ page, section, key, value, language_code })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: newContent });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/content', async (req, res) => {
  try {
    const { id, value: updateValue } = req.body;
    
    if (!id || !updateValue) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: updatedContent, error } = await supabase
      .from('content')
      .update({ value: updateValue })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: updatedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/content', async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing content ID' });
    }

    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Site Statistics API routes
app.get('/api/site-statistics', async (req, res) => {
  try {
    // First try to use the database function
    const { data, error } = await supabase.rpc('get_all_site_statistics');
    
    if (error) {
      console.log('Database function not available, using direct query:', error.message);
      
      // Fallback: query the site_stats table directly
      const { data: statsData, error: queryError } = await supabase
        .from('site_stats')
        .select('*')
        .order('stat_type');
      
      if (queryError) {
        console.log('Direct query failed:', queryError.message);
        
        // Calculate real values from the database
        console.log('Calculating real values from database...');
        
        // Calculate active volunteers (ONLY actual users, not organizations)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_type', 'organization')  // Only count actual users, not organizations
          .order('created_at', { ascending: false });

        const activeVolunteersCount = profiles?.length || 0;

        // Calculate hours contributed
        const { data: userEvents, error: ueError } = await supabase
          .from('user_events')
          .select(`
            event_id,
            events (
              arrival_time,
              estimated_end_time
            )
          `);

        let totalHours = 0;
        if (userEvents) {
          userEvents.forEach(ue => {
            const event = ue.events;
            if (event && event.arrival_time && event.estimated_end_time) {
              const start = new Date(event.arrival_time);
              const end = new Date(event.estimated_end_time);
              const hours = Math.ceil((end - start) / (1000 * 60 * 60));
              totalHours += hours;
            } else {
              totalHours += 2; // Default 2 hours
            }
          });
        }

        // Calculate partner organizations (same as admin dashboard - count all organizations)
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true });

        const partnerOrganizationsCount = organizations?.length || 0;
        
        // Return calculated values with fallback display values
        const defaultStats = {
          active_volunteers: {
            calculated_value: activeVolunteersCount,
            manual_override: null,
            display_value: activeVolunteersCount > 0 ? activeVolunteersCount : 2500,
            last_calculated_at: new Date().toISOString()
          },
          hours_contributed: {
            calculated_value: totalHours,
            manual_override: null,
            display_value: totalHours > 0 ? totalHours : 15000,
            last_calculated_at: new Date().toISOString()
          },
          partner_organizations: {
            calculated_value: partnerOrganizationsCount,
            manual_override: null,
            display_value: partnerOrganizationsCount > 0 ? partnerOrganizationsCount : 50,
            last_calculated_at: new Date().toISOString()
          }
        };
        
        return res.json({ success: true, data: defaultStats });
      }
      
      // Format the data from direct query
      const formattedStats = {};
      statsData.forEach(stat => {
        formattedStats[stat.stat_type] = {
          calculated_value: stat.calculated_value || 0,
          manual_override: stat.manual_override,
          display_value: stat.manual_override !== null ? stat.manual_override : (stat.calculated_value || 0),
          last_calculated_at: stat.last_calculated_at || new Date().toISOString()
        };
      });
      
      return res.json({ success: true, data: formattedStats });
    }
    
    // Format the data for frontend consumption
    const statsData = {};
    data.forEach(stat => {
      statsData[stat.stat_type] = {
        calculated_value: stat.calculated_value,
        manual_override: stat.manual_override,
        display_value: stat.display_value,
        last_calculated_at: stat.last_calculated_at
      };
    });
    
    res.json({ success: true, data: statsData });
  } catch (error) {
    console.error('Error fetching site statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/site-statistics', async (req, res) => {
  try {
    // Try to trigger recalculation of all statistics
    const { error: calcError } = await supabase.rpc('update_site_statistics');
    
    if (calcError) {
      console.log('Update function not available, calculating manually:', calcError.message);
      
      // Manual calculation fallback
      // Calculate active volunteers (ONLY actual users, not organizations)
      const { data: activeVolunteers, error: avError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('user_type', 'organization')  // Only count actual users, not organizations
        .order('created_at', { ascending: false });

      const activeVolunteersCount = activeVolunteers?.length || 0;

      // Calculate hours contributed
      const { data: userEvents, error: ueError } = await supabase
        .from('user_events')
        .select(`
          event_id,
          events (
            arrival_time,
            estimated_end_time
          )
        `);

      let totalHours = 0;
      if (userEvents) {
        userEvents.forEach(ue => {
          const event = ue.events;
          if (event && event.arrival_time && event.estimated_end_time) {
            const start = new Date(event.arrival_time);
            const end = new Date(event.estimated_end_time);
            const hours = Math.ceil((end - start) / (1000 * 60 * 60));
            totalHours += hours;
          } else {
            totalHours += 2; // Default 2 hours
          }
        });
      }

      // Calculate partner organizations (same as admin dashboard - count all organizations)
      const { data: organizations, error: orgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const partnerOrganizationsCount = organizations?.length || 0;

      // Update the calculated values
      const updates = [
        { stat_type: 'active_volunteers', calculated_value: activeVolunteersCount },
        { stat_type: 'hours_contributed', calculated_value: totalHours },
        { stat_type: 'partner_organizations', calculated_value: partnerOrganizationsCount }
      ];

      for (const update of updates) {
        await supabase
          .from('site_stats')
          .update({ 
            calculated_value: update.calculated_value,
            last_calculated_at: new Date().toISOString()
          })
          .eq('stat_type', update.stat_type);
      }
    }
    
    // Get updated statistics (try function first, then direct query)
    let data, fetchError;
    const { data: funcData, error: funcError } = await supabase.rpc('get_all_site_statistics');
    
    if (funcError) {
      console.log('Getting stats via function failed, using direct query:', funcError.message);
      const { data: directData, error: directError } = await supabase
        .from('site_stats')
        .select('*')
        .order('stat_type');
      
      data = directData;
      fetchError = directError;
    } else {
      data = funcData;
    }
    
    if (fetchError) throw fetchError;
    
    // Format the data
    const statsData = {};
    data.forEach(stat => {
      statsData[stat.stat_type] = {
        calculated_value: stat.calculated_value || 0,
        manual_override: stat.manual_override,
        display_value: stat.manual_override !== null ? stat.manual_override : (stat.calculated_value || 0),
        last_calculated_at: stat.last_calculated_at || new Date().toISOString()
      };
    });
    
    res.json({ 
      success: true, 
      message: 'Statistics recalculated successfully',
      data: statsData 
    });
  } catch (error) {
    console.error('Error recalculating statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/site-statistics', async (req, res) => {
  try {
    const { stat_type, manual_override } = req.body;
    
    if (!stat_type || manual_override === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: stat_type and manual_override' });
    }
    
    // Validate stat_type
    const validTypes = ['active_volunteers', 'hours_contributed', 'partner_organizations'];
    if (!validTypes.includes(stat_type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid stat_type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Update the manual override
    const { error } = await supabase
      .from('site_stats')
      .update({ manual_override: manual_override === null ? null : manual_override })
      .eq('stat_type', stat_type);
    
    if (error) throw error;
    
    // Get updated statistics
    const { data, error: fetchError } = await supabase.rpc('get_all_site_statistics');
    
    if (fetchError) throw fetchError;
    
    // Format the data
    const statsData = {};
    data.forEach(stat => {
      statsData[stat.stat_type] = {
        calculated_value: stat.calculated_value,
        manual_override: stat.manual_override,
        display_value: stat.display_value,
        last_calculated_at: stat.last_calculated_at
      };
    });
    
    res.json({ 
      success: true, 
      message: `${stat_type} manual override updated successfully`,
      data: statsData 
    });
  } catch (error) {
    console.error('Error updating manual override:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/site-statistics', async (req, res) => {
  try {
    const { stat_type } = req.query;
    
    if (!stat_type) {
      return res.status(400).json({ success: false, error: 'Missing stat_type parameter' });
    }
    
    // Validate stat_type
    const validTypes = ['active_volunteers', 'hours_contributed', 'partner_organizations'];
    if (!validTypes.includes(stat_type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid stat_type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Remove manual override (set to NULL)
    const { error } = await supabase
      .from('site_stats')
      .update({ manual_override: null })
      .eq('stat_type', stat_type);
    
    if (error) throw error;
    
    // Get updated statistics
    const { data, error: fetchError } = await supabase.rpc('get_all_site_statistics');
    
    if (fetchError) throw fetchError;
    
    // Format the data
    const statsData = {};
    data.forEach(stat => {
      statsData[stat.stat_type] = {
        calculated_value: stat.calculated_value,
        manual_override: stat.manual_override,
        display_value: stat.display_value,
        last_calculated_at: stat.last_calculated_at
      };
    });
    
    res.json({ 
      success: true, 
      message: `${stat_type} manual override removed successfully`,
      data: statsData 
    });
  } catch (error) {
    console.error('Error removing manual override:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Event signup API routes - bypass RLS using service role key
app.post('/api/event-signup', async (req, res) => {
  try {
    const { user_id, event_id, signed_up_by } = req.body;
    
    if (!user_id || !event_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // If attempting to sign up another user, enforce leadership role
    if (signed_up_by && signed_up_by !== user_id) {
      const { data: signerProfile, error: signerError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signed_up_by)
        .single();
      if (signerError || !signerProfile) {
        return res.status(403).json({ success: false, error: 'Invalid signer' });
      }
      const allowed = ['pa', 'faculty', 'student_leader', 'admin'];
      if (!allowed.includes(signerProfile.role)) {
        return res.status(403).json({ success: false, error: 'Only approved leaders can sign up others' });
      }
    }

    // Check if user exists in profiles table
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !userProfile) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found in profiles table. Please ensure you are logged in with a valid account.' 
      });
    }

    // Check if already signed up
    const { data: existing, error: checkError } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', user_id)
      .eq('event_id', event_id)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Already signed up for this event' });
    }

    // Check event capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('max_participants')
      .eq('id', event_id)
      .single();

    if (eventError) throw eventError;

    if (event.max_participants) {
      const { count, error: countError } = await supabase
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id);

      if (countError) throw countError;
      
      if (count >= event.max_participants) {
        return res.status(400).json({ success: false, error: 'Event is full' });
      }
    }

    // Insert signup
    const { data, error } = await supabase
      .from('user_events')
      .insert({
        user_id,
        event_id,
        signed_up_by: signed_up_by || user_id
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error signing up for event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/user-events/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('user_events')
      .select('*, events(*)')
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Group signup API route - handle multiple signups at once
app.post('/api/group-signup', async (req, res) => {
  try {
    const { user_ids, event_id, signed_up_by } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0 || !event_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Enforce leadership role for group signups
    if (!signed_up_by) {
      return res.status(400).json({ success: false, error: 'signed_up_by is required for group signup' });
    }
    const { data: signerProfile, error: signerError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signed_up_by)
      .single();
    if (signerError || !signerProfile) {
      return res.status(403).json({ success: false, error: 'Invalid signer' });
    }
    const allowedRoles = ['pa', 'faculty', 'student_leader', 'admin'];
    if (!allowedRoles.includes(signerProfile.role)) {
      return res.status(403).json({ success: false, error: 'Only approved leaders can perform group signup' });
    }

    // Check if all users exist in profiles table
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', user_ids);

    if (userError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Error checking user profiles. Please ensure all users have valid accounts.' 
      });
    }

    if (!userProfiles || userProfiles.length !== user_ids.length) {
      const foundUserIds = userProfiles ? userProfiles.map(p => p.id) : [];
      const missingUserIds = user_ids.filter(id => !foundUserIds.includes(id));
      return res.status(400).json({ 
        success: false, 
        error: `Some users not found in profiles table: ${missingUserIds.join(', ')}` 
      });
    }

    // Check event capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('max_participants')
      .eq('id', event_id)
      .single();

    if (eventError) throw eventError;

    if (event.max_participants) {
      const { count, error: countError } = await supabase
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id);

      if (countError) throw countError;
      
      const availableSpots = event.max_participants - count;
      if (user_ids.length > availableSpots) {
        return res.status(400).json({ 
          success: false, 
          error: `Not enough spots. Only ${availableSpots} spots remaining for ${user_ids.length} users.` 
        });
      }
    }

    // Check for existing signups
    const { data: existing, error: existingError } = await supabase
      .from('user_events')
      .select('user_id')
      .eq('event_id', event_id)
      .in('user_id', user_ids);

    if (existingError) throw existingError;

    let alreadySignedUpUsers = [];
    if (existing && existing.length > 0) {
      const existingUserIds = existing.map(e => e.user_id);
      alreadySignedUpUsers = existingUserIds;
      const newUserIds = user_ids.filter(id => !existingUserIds.includes(id));
      
      if (newUserIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'All selected users are already signed up for this event',
          alreadySignedUp: alreadySignedUpUsers
        });
      }
      
      // Only sign up users who aren't already signed up
      user_ids.splice(0, user_ids.length, ...newUserIds);
    }

    // Prepare signup data
    const signupData = user_ids.map(user_id => ({
      user_id,
      event_id,
      signed_up_by: signed_up_by || user_id
    }));

    // Insert all signups
    const { data, error } = await supabase
      .from('user_events')
      .insert(signupData)
      .select();

    if (error) throw error;
    
    res.json({ 
      success: true, 
      data,
      alreadySignedUp: alreadySignedUpUsers,
      newlySignedUp: user_ids.length,
      message: `Successfully signed up ${user_ids.length} ${user_ids.length === 1 ? 'user' : 'users'} for the event${alreadySignedUpUsers.length > 0 ? ` (${alreadySignedUpUsers.length} were already signed up)` : ''}`
    });
  } catch (error) {
    console.error('Error in group signup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/event-signup', async (req, res) => {
  try {
    const { user_id, event_id } = req.query;
    
    if (!user_id || !event_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { error } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', user_id)
      .eq('event_id', event_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling event signup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New endpoint for leadership users to cancel specific group signups they created
app.delete('/api/group-signup', async (req, res) => {
  try {
    const { user_id, event_id, signed_up_by } = req.body;
    
    if (!user_id || !event_id || !signed_up_by) {
      return res.status(400).json({ success: false, error: 'Missing required fields: user_id, event_id, signed_up_by' });
    }

    // Verify the requester is the one who signed up this user
    const { data: signupRecord, error: fetchError } = await supabase
      .from('user_events')
      .select('signed_up_by')
      .eq('user_id', user_id)
      .eq('event_id', event_id)
      .single();

    if (fetchError || !signupRecord) {
      return res.status(404).json({ success: false, error: 'Signup not found' });
    }

    // Only allow cancellation if the requester is the one who signed up the user
    if (signupRecord.signed_up_by !== signed_up_by) {
      return res.status(403).json({ success: false, error: 'Only the user who signed up this person can cancel their signup' });
    }

    // Delete the specific signup
    const { error } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', user_id)
      .eq('event_id', event_id);

    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Group signup cancelled successfully' 
    });
  } catch (error) {
    console.error('Error canceling group signup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

// Temporary endpoint to fix foreign key constraints
app.post('/api/fix-foreign-keys', async (req, res) => {
  try {
    console.log('🔧 Attempting to fix foreign key constraints...');
    
    // Since we can't execute DDL directly, let's try to work around the issue
    // by checking if the user exists in profiles before inserting
    
    res.json({ 
      success: true, 
      message: 'Foreign key fix endpoint created. The issue is that user_events.user_id references users table instead of profiles table.',
      instructions: 'Please run this SQL in your Supabase dashboard:',
      sql: `
-- Fix user_events foreign key constraint
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_signed_up_by_fkey;
ALTER TABLE public.user_events ADD CONSTRAINT user_events_signed_up_by_fkey 
  FOREIGN KEY (signed_up_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
      `
    });
  } catch (error) {
    console.error('Error in fix-foreign-keys endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Email server running on http://localhost:${port}`);
  console.log('Resend API key available:', !!process.env.RESEND_API_KEY);
});
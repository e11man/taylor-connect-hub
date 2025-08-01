import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = 3001;

// Supabase client for content management
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());

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

// Scheduled event cleanup function
const performEventCleanup = async () => {
  try {
    console.log('🔄 Starting scheduled event cleanup...');
    
    // Find events that ended more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: expiredEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, estimated_end_time')
      .lt('estimated_end_time', oneHourAgo);

    if (fetchError) {
      console.error('❌ Error fetching expired events:', fetchError);
      return;
    }

    if (!expiredEvents || expiredEvents.length === 0) {
      console.log('✅ No expired events found');
      return;
    }

    console.log(`🔍 Found ${expiredEvents.length} expired events to clean up`);

    let cleanedEvents = 0;
    const errors = [];

    for (const event of expiredEvents) {
      try {
        console.log(`🧹 Cleaning up event: ${event.title} (${event.id})`);

        // Check if event has any chat messages
        const { data: chatMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('event_id', event.id);

        if (chatError) {
          console.error(`❌ Error checking chat messages for event ${event.id}:`, chatError);
          errors.push(`Chat check failed for ${event.title}: ${chatError.message}`);
          continue;
        }

        // If no chat messages, delete the event and all related data
        if (!chatMessages || chatMessages.length === 0) {
          console.log(`💬 No chat messages found for event ${event.id}, proceeding with deletion`);

          // 1. Delete user_events (signups)
          const { error: userEventsError } = await supabase
            .from('user_events')
            .delete()
            .eq('event_id', event.id);

          if (userEventsError) {
            console.error(`❌ Error deleting user_events for event ${event.id}:`, userEventsError);
            errors.push(`User events deletion failed for ${event.title}: ${userEventsError.message}`);
            continue;
          }

          // 2. Delete the event
          const { error: eventDeleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', event.id);

          if (eventDeleteError) {
            console.error(`❌ Error deleting event ${event.id}:`, eventDeleteError);
            errors.push(`Event deletion failed for ${event.title}: ${eventDeleteError.message}`);
            continue;
          }

          console.log(`✅ Successfully cleaned up event: ${event.title}`);
          cleanedEvents++;
        } else {
          console.log(`💬 Event ${event.id} has ${chatMessages.length} chat messages, preserving event`);
          // Event has chat messages, so we preserve it
        }
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
        errors.push(`Processing failed for ${event.title}: ${error.message}`);
      }
    }

    console.log(`🎉 Event cleanup completed. Cleaned ${cleanedEvents} events.`);
    
    if (errors.length > 0) {
      console.error('⚠️ Errors during cleanup:', errors);
    }
    
  } catch (error) {
    console.error('❌ Event cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(performEventCleanup, 60 * 60 * 1000); // 1 hour

// Also run cleanup on server start
setTimeout(performEventCleanup, 5000); // Run 5 seconds after server start

// Event cleanup endpoint - removes events that ended more than 1 hour ago
app.post('/api/cleanup-events', async (req, res) => {
  try {
    console.log('Starting event cleanup process...');
    
    // Find events that ended more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: expiredEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, estimated_end_time')
      .lt('estimated_end_time', oneHourAgo);

    if (fetchError) {
      console.error('Error fetching expired events:', fetchError);
      return res.status(500).json({ 
        error: 'Failed to fetch expired events',
        details: fetchError.message
      });
    }

    if (!expiredEvents || expiredEvents.length === 0) {
      console.log('No expired events found');
      return res.json({ 
        success: true, 
        message: 'No expired events found',
        cleanedEvents: 0
      });
    }

    console.log(`Found ${expiredEvents.length} expired events to clean up`);

    let cleanedEvents = 0;
    const errors = [];

    for (const event of expiredEvents) {
      try {
        console.log(`Cleaning up event: ${event.title} (${event.id})`);

        // Check if event has any chat messages
        const { data: chatMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('event_id', event.id);

        if (chatError) {
          console.error(`Error checking chat messages for event ${event.id}:`, chatError);
          errors.push(`Chat check failed for ${event.title}: ${chatError.message}`);
          continue;
        }

        // If no chat messages, delete the event and all related data
        if (!chatMessages || chatMessages.length === 0) {
          console.log(`No chat messages found for event ${event.id}, proceeding with deletion`);

          // 1. Delete user_events (signups)
          const { error: userEventsError } = await supabase
            .from('user_events')
            .delete()
            .eq('event_id', event.id);

          if (userEventsError) {
            console.error(`Error deleting user_events for event ${event.id}:`, userEventsError);
            errors.push(`User events deletion failed for ${event.title}: ${userEventsError.message}`);
            continue;
          }

          // 2. Delete the event
          const { error: eventDeleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', event.id);

          if (eventDeleteError) {
            console.error(`Error deleting event ${event.id}:`, eventDeleteError);
            errors.push(`Event deletion failed for ${event.title}: ${eventDeleteError.message}`);
            continue;
          }

          console.log(`Successfully cleaned up event: ${event.title}`);
          cleanedEvents++;
        } else {
          console.log(`Event ${event.id} has ${chatMessages.length} chat messages, preserving event`);
          // Event has chat messages, so we preserve it
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errors.push(`Processing failed for ${event.title}: ${error.message}`);
      }
    }

    console.log(`Event cleanup completed. Cleaned ${cleanedEvents} events.`);
    
    res.json({ 
      success: true, 
      message: `Event cleanup completed. Cleaned ${cleanedEvents} events.`,
      cleanedEvents,
      totalExpiredEvents: expiredEvents.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Event cleanup error:', error);
    res.status(500).json({ 
      error: 'Internal server error during event cleanup' 
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
      env.PYTHONPATH = path.join(venvPath, 'lib', 'python3.13', 'site-packages');
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

// Event signup API routes - bypass RLS using service role key
app.post('/api/event-signup', async (req, res) => {
  try {
    const { user_id, event_id, signed_up_by } = req.body;
    
    if (!user_id || !event_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

app.listen(port, () => {
  console.log(`Email server running on http://localhost:${port}`);
  console.log('Resend API key available:', !!process.env.RESEND_API_KEY);
}); 
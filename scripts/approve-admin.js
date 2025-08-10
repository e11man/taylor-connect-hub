import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveAdminAccount() {
  try {
    console.log('Updating admin account status...');
    
    // Update the admin user profile status to 'active'
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('email', 'admin@admin.com')
      .select();

    if (error) {
      console.error('Error updating admin status:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Admin account status updated to active successfully!');
      console.log('Admin can now log in with:');
      console.log('Email: admin@admin.com');
      console.log('Password: admin123');
      console.log('Updated profile:', data[0]);
    } else {
      console.log('❌ No admin profile found with email admin@admin.com');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
approveAdminAccount();
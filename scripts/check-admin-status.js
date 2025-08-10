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

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin user status...');
    console.log('=' .repeat(50));
    
    // 1. Check if user exists in Supabase Auth
    console.log('\n1. Checking Supabase Auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    const adminAuthUser = authUsers.users.find(user => user.email === 'admin@admin.com');
    
    if (adminAuthUser) {
      console.log('✅ Admin user found in Supabase Auth:');
      console.log('   - ID:', adminAuthUser.id);
      console.log('   - Email:', adminAuthUser.email);
      console.log('   - Email confirmed:', adminAuthUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   - Created at:', adminAuthUser.created_at);
      console.log('   - Last sign in:', adminAuthUser.last_sign_in_at || 'Never');
      console.log('   - User metadata:', JSON.stringify(adminAuthUser.user_metadata, null, 2));
    } else {
      console.log('❌ Admin user NOT found in Supabase Auth');
      return;
    }
    
    // 2. Check if profile exists in profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@admin.com')
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('❌ Admin profile NOT found in profiles table');
      } else {
        console.error('❌ Error fetching profile:', profileError);
      }
      return;
    }
    
    if (profileData) {
      console.log('✅ Admin profile found in profiles table:');
      console.log('   - ID:', profileData.id);
      console.log('   - Email:', profileData.email);
      console.log('   - Status:', profileData.status);
      console.log('   - Role:', profileData.role);
      console.log('   - Created at:', profileData.created_at);
      console.log('   - Updated at:', profileData.updated_at);
      console.log('   - Full profile:', JSON.stringify(profileData, null, 2));
    }
    
    // 3. Check if IDs match
    console.log('\n3. Checking ID consistency...');
    if (adminAuthUser && profileData) {
      if (adminAuthUser.id === profileData.user_id) {
        console.log('✅ Auth user ID matches profile user_id');
      } else {
        console.log('❌ ID MISMATCH:');
        console.log('   - Auth user ID:', adminAuthUser.id);
        console.log('   - Profile user_id:', profileData.user_id);
      }
    }
    
    // 4. Test login attempt
    console.log('\n4. Testing login attempt...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      console.log('   - Error code:', loginError.status);
    } else {
      console.log('✅ Login successful!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Session exists:', !!loginData.session);
      
      // Sign out immediately
      await supabase.auth.signOut();
    }
    
    // 5. Summary and recommendations
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY & RECOMMENDATIONS:');
    
    if (!adminAuthUser) {
      console.log('❌ Admin user does not exist in Supabase Auth');
      console.log('💡 Run the seed-content.js script to create the admin user');
    } else if (!profileData) {
      console.log('❌ Admin profile does not exist in profiles table');
      console.log('💡 The profile trigger may not have fired. Check database triggers.');
    } else if (profileData.status !== 'active') {
      console.log('❌ Admin profile status is not active:', profileData.status);
      console.log('💡 Run the approve-admin.js script to activate the account');
    } else if (loginError) {
      console.log('❌ Login failed despite user existing and being active');
      console.log('💡 This may be a password issue or authentication configuration problem');
    } else {
      console.log('✅ Everything looks good! Admin should be able to log in.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
checkAdminStatus();
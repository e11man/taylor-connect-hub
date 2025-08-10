import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user setup...');
    console.log('=' .repeat(50));
    
    // 1. Check if admin user exists in Supabase Auth
    console.log('\n1. Checking Supabase Auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
      return;
    }
    
    const adminAuthUser = authUsers.users.find(u => u.email === 'admin@admin.com');
    
    if (adminAuthUser) {
      console.log('✅ Admin user found in Supabase Auth:');
      console.log('   - ID:', adminAuthUser.id);
      console.log('   - Email:', adminAuthUser.email);
      console.log('   - Email confirmed:', adminAuthUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   - Created:', adminAuthUser.created_at);
      console.log('   - Last sign in:', adminAuthUser.last_sign_in_at || 'Never');
    } else {
      console.log('❌ Admin user NOT found in Supabase Auth');
      console.log('💡 This means the admin user was never created via Supabase Auth');
    }
    
    // 2. Check if admin user exists in profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@admin.com')
      .single();
      
    if (profileError) {
      console.log('❌ Error or no profile found:', profileError.message);
    } else {
      console.log('✅ Admin profile found:');
      console.log('   - ID:', profile.id);
      console.log('   - User ID:', profile.user_id);
      console.log('   - Email:', profile.email);
      console.log('   - Status:', profile.status);
      console.log('   - Role:', profile.role);
      console.log('   - Dorm:', profile.dorm || 'Not set');
      console.log('   - Wing:', profile.wing || 'Not set');
    }
    
    // 3. Check if IDs match
    if (adminAuthUser && profile) {
      console.log('\n3. Checking ID consistency...');
      const idsMatch = adminAuthUser.id === profile.user_id;
      console.log('   - Auth ID matches Profile user_id:', idsMatch);
      
      if (!idsMatch) {
        console.log('❌ PROBLEM: IDs do not match!');
        console.log('   - Auth ID:', adminAuthUser.id);
        console.log('   - Profile user_id:', profile.user_id);
      }
    }
    
    // 4. Test actual login
    console.log('\n4. Testing Supabase Auth login...');
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'admin123'
      });
      
      if (loginError) {
        console.log('❌ Login failed:', loginError.message);
        
        // Check if it's a password issue
        if (loginError.message.includes('Invalid login credentials')) {
          console.log('💡 This suggests the password is incorrect or the user doesn\'t exist in Auth');
        }
      } else {
        console.log('✅ Login successful!');
        console.log('   - User ID:', loginData.user?.id);
        console.log('   - Email:', loginData.user?.email);
      }
    } catch (loginError) {
      console.log('❌ Login error:', loginError.message);
    }
    
    // 5. Summary and recommendations
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY & RECOMMENDATIONS:');
    
    if (!adminAuthUser) {
      console.log('\n❌ ISSUE: Admin user does not exist in Supabase Auth');
      console.log('💡 SOLUTION: Create the admin user in Supabase Auth first:');
      console.log('   1. Use Supabase dashboard or Auth API to create user');
      console.log('   2. Or run the seed script that creates the user properly');
    } else if (profile && adminAuthUser.id !== profile.user_id) {
      console.log('\n❌ ISSUE: Auth user and profile have mismatched IDs');
      console.log('💡 SOLUTION: Update the profile user_id to match the Auth user ID');
    } else if (!profile) {
      console.log('\n❌ ISSUE: Admin user exists in Auth but not in profiles table');
      console.log('💡 SOLUTION: Create a profile record for the admin user');
    } else {
      console.log('\n✅ Setup looks correct. Login should work.');
      console.log('💡 If login still fails, check the frontend authentication flow.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkAdminUser();
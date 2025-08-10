import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Hash password function
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Test data
const testUsers = [
  {
    name: 'Taylor Student Test',
    email: 'test_student@taylor.edu',
    password: 'testpassword123',
    user_type: 'student',
    dorm: 'Bergwall Hall',
    wing: '1st Bergwall'
  },
  {
    name: 'External User Test',
    email: 'external_test@gmail.com',
    password: 'testpassword123',
    user_type: 'external'
  }
];

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up existing test users...');
  
  for (const user of testUsers) {
    try {
      // Delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', user.email);
      
      if (profileError && !profileError.message.includes('No rows found')) {
        console.log(`⚠️ Error deleting profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Cleaned up profile for ${user.email}`);
      }
      
      // Try to delete from auth.users if exists
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === user.email);
        
        if (existingUser) {
          const { error: authError } = await supabase.auth.admin.deleteUser(existingUser.id);
          if (authError) {
            console.log(`⚠️ Error deleting auth user for ${user.email}:`, authError.message);
          } else {
            console.log(`✅ Cleaned up auth user for ${user.email}`);
          }
        }
      } catch (authError) {
        console.log(`⚠️ Auth cleanup error for ${user.email}:`, authError.message);
      }
    } catch (error) {
      console.log(`⚠️ General cleanup error for ${user.email}:`, error.message);
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n🔍 Checking RLS policies and permissions...');
  
  try {
    // Check table permissions
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.role_table_grants')
      .select('grantee, table_name, privilege_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .in('grantee', ['anon', 'authenticated']);
    
    if (permError) {
      console.log('⚠️ Could not check permissions:', permError.message);
    } else {
      console.log('📊 Table permissions:', permissions);
    }
    
    // Try a direct insert to test permissions
    console.log('\n🧪 Testing direct insert permissions...');
    const testData = {
      email: 'permission_test@test.com',
      password_hash: await hashPassword('test123'),
      user_type: 'external',
      status: 'pending'
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('profiles')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Direct insert failed:', insertError.message);
      console.log('   Code:', insertError.code);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Direct insert successful:', insertTest.id);
      
      // Clean up test record
      await supabase
        .from('profiles')
        .delete()
        .eq('id', insertTest.id);
      console.log('✅ Test record cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Error checking RLS policies:', error.message);
  }
}

// Simplified registration function for testing
async function testRegisterUser(userData) {
  try {
    console.log(`\n🧪 Testing registration for: ${userData.email}`);
    
    // Hash the password
    const passwordHash = await hashPassword(userData.password);
    
    // Determine user status
    const isTaylorUser = userData.email.endsWith('@taylor.edu');
    const status = 'pending'; // All users start as pending
    
    // Generate verification code for Taylor users
    const verificationCode = isTaylorUser ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    
    // Prepare profile data
    const profileData = {
      email: userData.email,
      password_hash: passwordHash,
      user_type: userData.user_type,
      status: status,
      dorm: userData.dorm || null,
      wing: userData.wing || null,
      verification_code: verificationCode
    };
    
    console.log('📋 Profile data to insert:', {
      email: profileData.email,
      user_type: profileData.user_type,
      status: profileData.status,
      dorm: profileData.dorm,
      wing: profileData.wing,
      has_password_hash: !!profileData.password_hash,
      has_verification_code: !!profileData.verification_code
    });
    
    // Insert into profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      console.log('   Code:', profileError.code);
      console.log('   Details:', profileError.details);
      console.log('   Hint:', profileError.hint);
      return { data: null, error: profileError };
    }
    
    console.log('✅ Profile created successfully:', {
      id: profile.id,
      email: profile.email,
      user_type: profile.user_type,
      status: profile.status
    });
    
    // If user_type is 'organization', create organization record
    if (userData.user_type === 'organization') {
      const orgData = {
        user_id: profile.id,
        name: userData.name || 'Test Organization',
        contact_email: userData.email,
        status: 'pending'
      };
      
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();
      
      if (orgError) {
        console.log('❌ Organization creation failed:', orgError.message);
        // Rollback profile creation
        await supabase.from('profiles').delete().eq('id', profile.id);
        return { data: null, error: orgError };
      }
      
      console.log('✅ Organization created successfully:', organization.id);
    }
    
    return { data: { profile }, error: null };
    
  } catch (error) {
    console.log('💥 Unexpected error during registration:', error.message);
    return { data: null, error };
  }
}

async function testUserRegistration(userData) {
  console.log(`\n🧪 Testing registration for: ${userData.email}`);
  console.log('📋 User data:', {
    email: userData.email,
    user_type: userData.user_type,
    dorm: userData.dorm || 'N/A',
    wing: userData.wing || 'N/A'
  });
  
  const { data, error } = await testRegisterUser(userData);
  
  if (error) {
    console.log('❌ Registration failed:', error.message);
    return false;
  } else {
    console.log('✅ Registration successful!');
    return true;
  }
}

async function runRegistrationTests() {
  console.log('🚀 Starting User Registration Tests...');
  console.log('=' .repeat(50));
  
  // Step 1: Cleanup existing test users
  await cleanupTestUsers();
  
  // Step 2: Check RLS policies and permissions
  await checkRLSPolicies();
  
  // Step 3: Test user registrations
  const results = [];
  
  for (const userData of testUsers) {
    const success = await testUserRegistration(userData);
    results.push({ user: userData.email, success });
  }
  
  // Step 4: Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.user}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Overall: ${successCount}/${totalCount} registrations successful`);
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! User registration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above for details.');
  }
  
  // Step 5: Cleanup test users
  console.log('\n🧹 Final cleanup...');
  await cleanupTestUsers();
  
  console.log('\n✅ Test completed!');
}

// Run the tests
runRegistrationTests().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
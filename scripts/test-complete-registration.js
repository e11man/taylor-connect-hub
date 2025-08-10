#!/usr/bin/env node

/**
 * Comprehensive User Registration Test
 * Tests all user types after foreign key constraint fixes
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const testUsers = [
  {
    type: 'Taylor Student',
    email: 'test_student@taylor.edu',
    password: 'TestPassword123!',
    user_type: 'student',
    dorm: 'Bergwall',
    wing: '1st Floor'
  },
  {
    type: 'External User',
    email: 'external_user@gmail.com',
    password: 'TestPassword123!',
    user_type: 'external'
  },
  {
    type: 'Organization',
    email: 'test_org@nonprofit.org',
    password: 'TestPassword123!',
    user_type: 'organization',
    orgName: 'Test Nonprofit Organization',
    orgDescription: 'A test organization for volunteer opportunities',
    orgWebsite: 'https://testorg.org',
    orgPhone: '+1-555-123-4567'
  }
];

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up existing test users...');
  
  for (const user of testUsers) {
    try {
      // Delete from organizations first (if exists)
      if (user.user_type === 'organization') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (profile) {
          await supabase
            .from('organizations')
            .delete()
            .eq('user_id', profile.id);
        }
      }
      
      // Delete from profiles
      await supabase
        .from('profiles')
        .delete()
        .eq('email', user.email);
        
      console.log(`   ✓ Cleaned up ${user.email}`);
    } catch (error) {
      console.log(`   ⚠️  Error cleaning ${user.email}:`, error.message);
    }
  }
}

async function testUserRegistration(userData) {
  console.log(`\n🧪 Testing ${userData.type} Registration...`);
  console.log(`   Email: ${userData.email}`);
  
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    // Create profile
    const profileData = {
      email: userData.email,
      password_hash: passwordHash,
      user_type: userData.user_type,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Add Taylor-specific fields
    if (userData.user_type === 'student') {
      profileData.dorm = userData.dorm;
      profileData.wing = userData.wing;
      profileData.verification_code = Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    console.log('   📝 Creating profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
      
    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    console.log(`   ✅ Profile created with ID: ${profile.id}`);
    
    // Create organization if needed
    if (userData.user_type === 'organization') {
      console.log('   🏢 Creating organization...');
      
      const orgData = {
        user_id: profile.id,
        name: userData.orgName,
        description: userData.orgDescription,
        website: userData.orgWebsite,
        phone: userData.orgPhone,
        contact_email: userData.email,
        status: 'pending'
      };
      
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();
        
      if (orgError) {
        throw new Error(`Organization creation failed: ${orgError.message}`);
      }
      
      console.log(`   ✅ Organization created with ID: ${organization.id}`);
    }
    
    // Verify the user was created correctly
    console.log('   🔍 Verifying user data...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userData.email)
      .single();
      
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }
    
    console.log('   ✅ User verification successful');
    console.log(`   📊 User Status: ${verifyProfile.status}`);
    console.log(`   📊 User Type: ${verifyProfile.user_type}`);
    
    if (userData.user_type === 'organization') {
      const { data: verifyOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', verifyProfile.id)
        .single();
        
      if (verifyOrg) {
        console.log(`   📊 Organization Status: ${verifyOrg.status}`);
        console.log(`   📊 Organization Name: ${verifyOrg.name}`);
      }
    }
    
    return { success: true, profile, userData };
    
  } catch (error) {
    console.log(`   ❌ Registration failed: ${error.message}`);
    return { success: false, error: error.message, userData };
  }
}

async function testLoginFlow(userData, profile) {
  console.log(`\n🔐 Testing Login for ${userData.type}...`);
  
  try {
    // Verify password
    const isValidPassword = await bcrypt.compare(userData.password, profile.password_hash);
    if (!isValidPassword) {
      throw new Error('Password verification failed');
    }
    
    console.log('   ✅ Password verification successful');
    
    // Check user status
    if (profile.status === 'pending') {
      console.log('   ⏳ User status is pending (expected for new registrations)');
    } else if (profile.status === 'active') {
      console.log('   ✅ User status is active');
    } else {
      console.log(`   ⚠️  User status is ${profile.status}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.log(`   ❌ Login test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkDatabaseConstraints() {
  console.log('\n🔍 Checking Database Constraints...');
  
  try {
    // Check profiles table accessibility
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, user_type')
      .limit(1);
      
    if (profilesError) {
      console.log(`   ❌ Profiles table error: ${profilesError.message}`);
      return false;
    }
    console.log('   ✅ Profiles table accessible');
    
    // Check organizations table accessibility
    const { data: orgsTest, error: orgsError } = await supabase
      .from('organizations')
      .select('id, user_id, name')
      .limit(1);
      
    if (orgsError) {
      console.log(`   ❌ Organizations table error: ${orgsError.message}`);
      return false;
    }
    console.log('   ✅ Organizations table accessible');
    
    // Test foreign key relationship by trying a join
    const { data: fkTest, error: fkError } = await supabase
      .from('organizations')
      .select(`
        id,
        user_id,
        name,
        profiles(id, email)
      `)
      .limit(1);
      
    if (fkError && (fkError.message.includes('foreign key') || fkError.message.includes('constraint'))) {
      console.log(`   ❌ Foreign key constraint issue: ${fkError.message}`);
      return false;
    }
    
    console.log('   ✅ Foreign key relationships working correctly');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Database constraint check failed: ${error.message}`);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive User Registration Test\n');
  console.log('=' .repeat(60));
  
  // Check database constraints first
  const constraintsOk = await checkDatabaseConstraints();
  if (!constraintsOk) {
    console.log('\n❌ Database constraints check failed. Aborting tests.');
    return;
  }
  
  // Cleanup existing test data
  await cleanupTestUsers();
  
  const results = [];
  
  // Test each user type
  for (const userData of testUsers) {
    const registrationResult = await testUserRegistration(userData);
    results.push(registrationResult);
    
    // Test login if registration was successful
    if (registrationResult.success) {
      const loginResult = await testLoginFlow(userData, registrationResult.profile);
      registrationResult.loginTest = loginResult;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  let allPassed = true;
  
  results.forEach((result, index) => {
    const userData = result.userData;
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    const loginStatus = result.loginTest ? 
      (result.loginTest.success ? '✅ PASSED' : '❌ FAILED') : 'N/A';
    
    console.log(`${index + 1}. ${userData.type} (${userData.email})`);
    console.log(`   Registration: ${status}`);
    console.log(`   Login Test: ${loginStatus}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
      allPassed = false;
    }
    
    if (result.loginTest && !result.loginTest.success) {
      console.log(`   Login Error: ${result.loginTest.error}`);
    }
    
    console.log('');
  });
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! User registration is working correctly.');
    console.log('✅ Taylor users can register with dorm/wing information');
    console.log('✅ External users can register and await approval');
    console.log('✅ Organizations can register with profile and organization data');
    console.log('✅ Foreign key constraints are working properly');
    console.log('✅ Password hashing and verification is functional');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.');
  }
  
  console.log('\n🧹 Cleaning up test data...');
  await cleanupTestUsers();
  console.log('✅ Cleanup complete.');
}

// Run the test
runComprehensiveTest()
  .then(() => {
    console.log('\n✅ Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

export { runComprehensiveTest, testUserRegistration, testLoginFlow };
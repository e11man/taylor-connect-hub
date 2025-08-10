#!/usr/bin/env node

/**
 * Test script to verify organization registration functionality
 * after fixing foreign key constraints
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrganizationRegistration() {
  console.log('🧪 Testing Organization Registration...');
  console.log('=' .repeat(50));

  const testEmail = `test-org-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const orgName = `Test Organization ${Date.now()}`;
  
  try {
    // Step 1: Create organization profile
    console.log('\n1. Creating organization profile...');
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: testEmail,
        password_hash: passwordHash,
        user_type: 'organization',
        status: 'pending'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      return false;
    }
    
    console.log('✅ Profile created successfully:', {
      id: profile.id,
      email: profile.email,
      user_type: profile.user_type,
      status: profile.status
    });
    
    // Step 2: Create organization record
    console.log('\n2. Creating organization record...');
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        user_id: profile.id,
        name: orgName,
        description: 'Test organization for registration testing',
        contact_email: testEmail,
        website: 'https://test-org.example.com',
        phone: '+1-555-123-4567',
        status: 'pending'
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('❌ Failed to create organization:', orgError.message);
      // Clean up profile
      await supabase.from('profiles').delete().eq('id', profile.id);
      return false;
    }
    
    console.log('✅ Organization created successfully:', {
      id: organization.id,
      name: organization.name,
      user_id: organization.user_id,
      status: organization.status
    });
    
    // Step 3: Verify foreign key relationships
    console.log('\n3. Verifying foreign key relationships...');
    const { data: orgWithProfile, error: joinError } = await supabase
      .from('organizations')
      .select(`
        *,
        profiles!organizations_user_id_fkey(
          id,
          email,
          user_type,
          status
        )
      `)
      .eq('id', organization.id)
      .single();
    
    if (joinError) {
      console.error('❌ Failed to verify relationships:', joinError.message);
      return false;
    }
    
    console.log('✅ Foreign key relationships verified:', {
      organization_id: orgWithProfile.id,
      profile_id: orgWithProfile.profiles.id,
      profile_email: orgWithProfile.profiles.email
    });
    
    // Step 4: Test organization login simulation
    console.log('\n4. Testing organization login simulation...');
    const { data: loginProfile, error: loginError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (loginError) {
      console.error('❌ Failed to retrieve profile for login:', loginError.message);
      return false;
    }
    
    const passwordMatch = await bcrypt.compare(testPassword, loginProfile.password_hash);
    if (!passwordMatch) {
      console.error('❌ Password verification failed');
      return false;
    }
    
    console.log('✅ Login simulation successful');
    
    // Step 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    await supabase.from('organizations').delete().eq('id', organization.id);
    await supabase.from('profiles').delete().eq('id', profile.id);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Organization registration test completed successfully!');
    console.log('✅ All foreign key constraints are working properly');
    console.log('✅ Organization registration flow is functional');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    return false;
  }
}

async function testConstraintValidation() {
  console.log('\n🔒 Testing Foreign Key Constraint Validation...');
  console.log('=' .repeat(50));
  
  try {
    // Try to create organization with non-existent user_id
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        user_id: fakeUserId,
        name: 'Invalid Organization',
        contact_email: 'invalid@example.com',
        status: 'pending'
      });
    
    if (error && error.message.includes('foreign key constraint')) {
      console.log('✅ Foreign key constraint is properly enforced');
      console.log('✅ Cannot create organization with invalid user_id');
      return true;
    } else {
      console.error('❌ Foreign key constraint is not working properly');
      return false;
    }
    
  } catch (error) {
    if (error.message.includes('foreign key constraint')) {
      console.log('✅ Foreign key constraint is properly enforced');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Starting Organization Registration Tests');
  console.log('Time:', new Date().toISOString());
  
  const test1 = await testOrganizationRegistration();
  const test2 = await testConstraintValidation();
  
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  console.log(`Organization Registration: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Constraint Validation: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! Organization registration is working properly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);

export { testOrganizationRegistration, testConstraintValidation };
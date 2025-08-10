import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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

// Replicate the loginUser function with detailed debugging
async function debugLoginUser(email, password) {
  try {
    console.log('🔍 Step 1: Fetching user from profiles table...');
    console.log('   Email:', email);
    
    // Get user from profiles table
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash, user_type, status, role, dorm, wing, verification_code, created_at, updated_at, user_id')
      .eq('email', email)
      .single();
      
    if (error) {
      console.log('❌ Database error:', error.message);
      return { error: { message: 'Invalid email or password' } };
    }
    
    if (!user) {
      console.log('❌ User not found');
      return { error: { message: 'Invalid email or password' } };
    }
    
    console.log('✅ User found:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - User Type:', user.user_type);
    console.log('   - Status:', user.status);
    console.log('   - Role:', user.role);
    console.log('   - Has password hash:', !!user.password_hash);
    
    if (user.password_hash) {
      console.log('   - Password hash length:', user.password_hash.length);
      console.log('   - Password hash starts with:', user.password_hash.substring(0, 10) + '...');
    }
    
    console.log('\n🔍 Step 2: Verifying password...');
    console.log('   Password to verify:', password);
    
    if (!user.password_hash) {
      console.log('❌ No password hash found');
      return { error: { message: 'Invalid email or password' } };
    }
    
    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('   - Password verification result:', isValidPassword);
    } catch (bcryptError) {
      console.log('❌ Bcrypt error:', bcryptError.message);
      return { error: { message: 'Invalid email or password' } };
    }
    
    if (!isValidPassword) {
      console.log('❌ Password verification failed');
      return { error: { message: 'Invalid email or password' } };
    }
    
    console.log('✅ Password verified successfully');
    
    console.log('\n🔍 Step 3: Checking user status...');
    
    // For organizations, check organization status first
    if (user.user_type === 'organization') {
      console.log('   User is organization, checking org status...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (orgError || !orgData) {
        console.log('❌ Organization not found:', orgError?.message);
        return { error: { message: 'Organization not found' } };
      }

      console.log('   - Organization status:', orgData.status);

      if (orgData.status === 'pending') {
        return { error: { message: 'Organization pending approval' } };
      }

      if (orgData.status === 'blocked') {
        return { error: { message: 'Organization blocked' } };
      }

      if (orgData.status !== 'approved') {
        return { error: { message: `Organization status: ${orgData.status}. Contact admin for assistance.` } };
      }

      // Update profile status to active
      await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', user.id);
    } else {
      console.log('   User is not organization, checking profile status...');
      console.log('   - Profile status:', user.status);
      
      // For non-organization users, check profile status
      if (user.status === 'pending') {
        return { error: { message: 'Account pending verification' } };
      }

      if (user.status === 'blocked') {
        return { error: { message: 'Account blocked' } };
      }

      if (user.status !== 'active') {
        return { error: { message: `Account status: ${user.status}. Contact admin for assistance.` } };
      }
    }
    
    console.log('✅ Status checks passed');
    
    console.log('\n🔍 Step 4: Generating access token...');
    
    // Generate access token (simplified for testing)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      status: user.status,
      role: user.role
    };
    
    const accessToken = 'test_token_' + Date.now(); // Simplified token
    
    console.log('✅ Access token generated');
    
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        status: user.status,
        role: user.role
      },
      access_token: accessToken
    };
    
    console.log('\n✅ Login successful!');
    console.log('📋 Session data:', JSON.stringify(sessionData, null, 2));
    
    return { data: { session: sessionData } };
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('   Stack:', error.stack);
    return { error: { message: 'Login failed. Please try again.' } };
  }
}

async function testAdminLogin() {
  console.log('🧪 Testing admin login flow with detailed debugging...');
  console.log('=' .repeat(60));
  
  const result = await debugLoginUser('admin@admin.com', 'admin123');
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 FINAL RESULT:');
  
  if (result.error) {
    console.log('❌ Login failed:', result.error.message);
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', result.data.session.user.id);
    console.log('   Email:', result.data.session.user.email);
    console.log('   Role:', result.data.session.user.role);
    console.log('   Status:', result.data.session.user.status);
  }
}

// Run the test
testAdminLogin();
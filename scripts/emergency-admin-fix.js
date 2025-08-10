import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
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

// Verify password function
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

async function emergencyAdminFix() {
  try {
    console.log('🚨 EMERGENCY ADMIN FIX - Starting complete reset...');
    
    // Step 1: Delete any existing admin user from both auth and profiles
    console.log('\n1️⃣ Deleting existing admin user...');
    
    // First delete from profiles
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', 'admin@admin.com');
    
    if (deleteProfileError) {
      console.log('⚠️ Profile delete error (might not exist):', deleteProfileError.message);
    } else {
      console.log('✅ Existing admin profile deleted');
    }
    
    // Try to delete from auth.users (this might fail if user doesn't exist)
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers.users.find(user => user.email === 'admin@admin.com');
      
      if (existingAdmin) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(existingAdmin.id);
        if (deleteAuthError) {
          console.log('⚠️ Auth delete error:', deleteAuthError.message);
        } else {
          console.log('✅ Existing admin auth user deleted');
        }
      }
    } catch (authError) {
      console.log('⚠️ Auth cleanup error (continuing):', authError.message);
    }
    
    // Step 2: Create user in Supabase Auth first
    console.log('\n2️⃣ Creating admin user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@admin.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        dorm: 'Admin Building',
        wing: 'Administrative'
      }
    });
    
    if (authError) {
      console.error('❌ Failed to create auth user:', authError);
      return;
    }
    
    console.log('✅ Auth user created with ID:', authData.user.id);
    
    // Step 3: Hash the password for profiles table
    console.log('\n3️⃣ Generating secure password hash...');
    const passwordHash = await hashPassword('admin123');
    console.log('✅ Password hash generated:', passwordHash.substring(0, 20) + '...');
    
    // Step 4: Check if profile was auto-created and update it
    console.log('\n4️⃣ Checking for auto-created profile...');
    
    // Wait a moment for any triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    let newAdmin;
    
    if (existingProfile) {
      console.log('✅ Auto-created profile found, updating it...');
      
      const updateData = {
        email: 'admin@admin.com',
        password_hash: passwordHash,
        user_type: 'admin',
        status: 'active',
        role: 'admin',
        dorm: 'Admin Building',
        wing: 'Administrative'
      };
      
      const { data: updatedAdmin, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', authData.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Failed to update admin profile:', updateError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return;
      }
      
      newAdmin = updatedAdmin;
      console.log('✅ Admin profile updated successfully!');
    } else {
      console.log('📝 No auto-created profile found, creating new one...');
      
      const adminData = {
        user_id: authData.user.id,
        email: 'admin@admin.com',
        password_hash: passwordHash,
        user_type: 'admin',
        status: 'active',
        role: 'admin',
        dorm: 'Admin Building',
        wing: 'Administrative'
      };
      
      const { data: createdAdmin, error: createError } = await supabase
        .from('profiles')
        .insert(adminData)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create admin profile:', createError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return;
      }
      
      newAdmin = createdAdmin;
      console.log('✅ Admin profile created successfully!');
    }
    
    console.log('📋 Admin details:', {
      id: newAdmin.id,
      user_id: newAdmin.user_id,
      email: newAdmin.email,
      user_type: newAdmin.user_type,
      status: newAdmin.status,
      role: newAdmin.role
    });
    
    // Step 5: Test the login immediately
    console.log('\n5️⃣ Testing admin login...');
    
    // Fetch the user we just created
    const { data: testUser, error: testFetchError } = await supabase
      .from('profiles')
      .select('id, email, password_hash, user_type, status, role')
      .eq('email', 'admin@admin.com')
      .single();
    
    if (testFetchError || !testUser) {
      console.error('❌ Failed to fetch admin user for testing:', testFetchError);
      return;
    }
    
    // Test password verification
    const isPasswordValid = await verifyPassword('admin123', testUser.password_hash);
    
    if (!isPasswordValid) {
      console.error('❌ Password verification failed!');
      return;
    }
    
    console.log('✅ Password verification successful!');
    
    // Check all required fields
    const requiredFields = {
      email: testUser.email,
      user_type: testUser.user_type,
      status: testUser.status,
      role: testUser.role,
      password_hash: testUser.password_hash ? 'SET' : 'NOT SET'
    };
    
    console.log('\n📊 Final verification:');
    console.log(requiredFields);
    
    // Verify all conditions for successful login
    const loginChecks = {
      'Email matches': testUser.email === 'admin@admin.com',
      'Password hash exists': !!testUser.password_hash,
      'Password verifies': isPasswordValid,
      'Status is active': testUser.status === 'active',
      'Role is admin': testUser.role === 'admin',
      'User type set': !!testUser.user_type
    };
    
    console.log('\n🔍 Login readiness checks:');
    Object.entries(loginChecks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allChecksPassed = Object.values(loginChecks).every(check => check === true);
    
    if (allChecksPassed) {
      console.log('\n🎉 SUCCESS! Admin login should now work!');
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@admin.com');
      console.log('   Password: admin123');
      console.log('\n🔗 Try logging in at: http://localhost:5173/admin');
    } else {
      console.log('\n❌ Some checks failed. Admin login may not work.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during emergency fix:', error);
  }
}

// Run the emergency fix
emergencyAdminFix();
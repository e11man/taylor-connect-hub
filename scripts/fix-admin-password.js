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

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin password...');
    console.log('=' .repeat(50));
    
    // Generate correct bcrypt hash for 'admin123'
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Generated new password hash for "admin123"');
    console.log('   Hash:', hashedPassword);
    
    // Update the admin user with the correct hash
    const { data, error } = await supabase
      .from('profiles')
      .update({ password_hash: hashedPassword })
      .eq('email', 'admin@admin.com')
      .select()
      .single();
      
    if (error) {
      console.log('❌ Error updating password:', error.message);
      return;
    }
    
    console.log('✅ Admin password updated successfully');
    
    // Test the password verification
    console.log('\n🧪 Testing password verification...');
    const isValid = await bcrypt.compare('admin123', hashedPassword);
    console.log('   Password "admin123" is valid:', isValid);
    
    // Test with wrong password
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('   Password "wrongpassword" is valid:', isInvalid);
    
    console.log('\n✅ Admin password fix completed!');
    console.log('💡 You should now be able to log in with admin@admin.com / admin123');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixAdminPassword();
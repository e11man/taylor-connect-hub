import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRealTimeVolunteerCount() {
  try {
    console.log('🔧 Setting up real-time volunteer count updates...\n');
    
    // First, let's test the current count
    console.log('📊 Current user count from profiles table (excluding organizations):');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_type', 'organization')  // Only count actual users, not organizations
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    const currentCount = profiles.length;
    console.log(`  - Actual users (excluding organizations): ${currentCount}`);
    
    // Log user details for transparency
    profiles.forEach(profile => {
      console.log(`    - ${profile.email} (${profile.user_type || 'unknown'} - ${profile.role || 'user'})`);
    });
    
    // Update the content table with current count
    const { error: updateError } = await supabase
      .from('content')
      .update({ value: currentCount.toString() })
      .eq('page', 'homepage')
      .eq('section', 'impact')
      .eq('key', 'active_volunteers');
    
    if (updateError) {
      console.error('❌ Error updating content:', updateError);
      return;
    }
    
    console.log(`  ✅ Updated active volunteers to ${currentCount}`);
    
    // Now let's set up a real-time subscription to monitor changes
    console.log('\n📡 Setting up real-time subscription...');
    
    const channel = supabase
      .channel('volunteer-count-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        async (payload) => {
          console.log(`\n🔄 Profile change detected: ${payload.eventType}`);
          
          if (payload.eventType === 'INSERT') {
            console.log('  ➕ New user added:', payload.new?.email);
          } else if (payload.eventType === 'DELETE') {
            console.log('  ➖ User removed:', payload.old?.email);
          } else if (payload.eventType === 'UPDATE') {
            console.log('  ✏️ User updated:', payload.new?.email);
          }
          
          // Immediately update the count
          try {
            const { data: newProfiles, error: newProfilesError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .neq('user_type', 'organization');  // Only count actual users, not organizations
            
            if (newProfilesError) {
              console.error('  ❌ Error getting new count:', newProfilesError);
              return;
            }
            
            const newCount = newProfiles?.length || 0;
            console.log(`  📊 New total: ${newCount} actual users (excluding organizations)`);
            
            // Update the content table
            const { error: countUpdateError } = await supabase
              .from('content')
              .update({ value: newCount.toString() })
              .eq('page', 'homepage')
              .eq('section', 'impact')
              .eq('key', 'active_volunteers');
            
            if (countUpdateError) {
              console.error('  ❌ Error updating count:', countUpdateError);
            } else {
              console.log(`  ✅ Active volunteers updated to ${newCount}`);
            }
            
          } catch (error) {
            console.error('  ❌ Error in real-time update:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('  ✅ Real-time subscription active');
          console.log('  🔄 Monitoring profiles table for changes...');
        } else {
          console.log('  ⚠️ Subscription status:', status);
        }
      });
    
    // Keep the script running to monitor changes
    console.log('\n🎯 Real-time monitoring active!');
    console.log('   - The active volunteers count will automatically update');
    console.log('   - Press Ctrl+C to stop monitoring');
    console.log('\n📱 Your frontend should now show real-time updates');
    
    // Keep alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping real-time monitoring...');
      supabase.removeChannel(channel);
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupRealTimeVolunteerCount()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

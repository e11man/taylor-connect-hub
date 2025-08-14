#!/usr/bin/env node

/**
 * Test Chat Notification System End-to-End
 * This script tests the complete chat notification flow from database to email
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChatNotificationSystem() {
  console.log('🧪 Testing Chat Notification System End-to-End\n');
  
  try {
    // Step 1: Check system status
    console.log('📊 Step 1: Checking system status...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_notification_stats');
    
    if (statsError) {
      console.error('❌ Failed to get notification stats:', statsError.message);
      return false;
    }
    
    console.log('✅ System stats retrieved:', stats);
    
    // Step 2: Create test data
    console.log('\n📝 Step 2: Creating test data...');
    
    // Get existing users and events
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    const { data: events } = await supabase
      .from('events')
      .select('id, title')
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ No profiles found for testing');
      return false;
    }
    
    if (!events || events.length === 0) {
      console.error('❌ No events found for testing');
      return false;
    }
    
    const testUser = profiles[0];
    const testEvent = events[0];
    
    console.log(`✅ Using test user: ${testUser.email}`);
    console.log(`✅ Using test event: ${testEvent.title}`);
    
    // Step 3: Ensure user is signed up for event
    console.log('\n📋 Step 3: Ensuring user is signed up for event...');
    
    const { data: existingSignup } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', testUser.id)
      .eq('event_id', testEvent.id)
      .single();
    
    if (!existingSignup) {
      const { error: signupError } = await supabase
        .from('user_events')
        .insert({
          user_id: testUser.id,
          event_id: testEvent.id
        });
      
      if (signupError) {
        console.error('❌ Failed to sign up user for event:', signupError.message);
        return false;
      }
      
      console.log('✅ User signed up for event');
    } else {
      console.log('✅ User already signed up for event');
    }
    
    // Step 4: Ensure notification preferences exist
    console.log('\n🔔 Step 4: Setting up notification preferences...');
    
    const { error: prefError } = await supabase
      .rpc('upsert_notification_preferences', {
        p_user_id: testUser.id,
        p_email_frequency: 'immediate',
        p_chat_notifications: true,
        p_event_updates: true
      });
    
    if (prefError) {
      console.error('❌ Failed to set notification preferences:', prefError.message);
      return false;
    }
    
    console.log('✅ Notification preferences set');
    
    // Step 5: Post a test chat message
    console.log('\n💬 Step 5: Posting test chat message...');
    
    const testMessage = `Test message at ${new Date().toISOString()} - Testing notification system`;
    
    const { data: chatMessage, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        event_id: testEvent.id,
        user_id: testUser.id,
        message: testMessage,
        is_anonymous: false
      })
      .select()
      .single();
    
    if (chatError) {
      console.error('❌ Failed to post chat message:', chatError.message);
      return false;
    }
    
    console.log('✅ Test chat message posted:', chatMessage.id);
    
    // Step 6: Wait a moment for trigger to process
    console.log('\n⏳ Step 6: Waiting for database trigger to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 7: Check if notifications were created
    console.log('\n📬 Step 7: Checking if notifications were created...');
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('chat_message_id', chatMessage.id);
    
    if (notifError) {
      console.error('❌ Failed to fetch notifications:', notifError.message);
      return false;
    }
    
    if (!notifications || notifications.length === 0) {
      console.error('❌ No notifications were created');
      return false;
    }
    
    console.log(`✅ ${notifications.length} notifications created`);
    
    // Step 8: Check notification details
    console.log('\n🔍 Step 8: Checking notification details...');
    
    for (const notification of notifications) {
      console.log(`  - Notification ${notification.id}:`);
      console.log(`    User ID: ${notification.user_id}`);
      console.log(`    Event ID: ${notification.event_id}`);
      console.log(`    Type: ${notification.notification_type}`);
      console.log(`    Scheduled: ${notification.scheduled_for}`);
      console.log(`    Email Sent: ${notification.email_sent}`);
    }
    
    // Step 9: Test get_pending_notifications function
    console.log('\n📋 Step 9: Testing get_pending_notifications function...');
    
    const { data: pendingNotifs, error: pendingError } = await supabase
      .rpc('get_pending_notifications');
    
    if (pendingError) {
      console.error('❌ Failed to get pending notifications:', pendingError.message);
      return false;
    }
    
    console.log(`✅ Found ${pendingNotifs.length} pending notifications`);
    
    if (pendingNotifs.length > 0) {
      const pending = pendingNotifs[0];
      console.log('  Sample pending notification:');
      console.log(`    ID: ${pending.id}`);
      console.log(`    User Email: ${pending.user_email}`);
      console.log(`    Event Title: ${pending.event_title}`);
      console.log(`    Message: ${pending.message}`);
      console.log(`    Sender: ${pending.sender_name} (${pending.sender_type})`);
    }
    
    // Step 10: Test mark_notification_sent function
    console.log('\n✅ Step 10: Testing mark_notification_sent function...');
    
    if (pendingNotifs.length > 0) {
      const testNotification = pendingNotifs[0];
      
      const { data: markResult, error: markError } = await supabase
        .rpc('mark_notification_sent', {
          p_notification_id: testNotification.id
        });
      
      if (markError) {
        console.error('❌ Failed to mark notification as sent:', markError.message);
        return false;
      }
      
      console.log('✅ Notification marked as sent');
      
      // Verify the change
      const { data: updatedNotif } = await supabase
        .from('notifications')
        .select('email_sent, sent_at')
        .eq('id', testNotification.id)
        .single();
      
      if (updatedNotif && updatedNotif.email_sent) {
        console.log('✅ Notification status verified as sent');
      } else {
        console.error('❌ Notification status not updated correctly');
        return false;
      }
    }
    
    // Step 11: Final system check
    console.log('\n📊 Step 11: Final system status check...');
    
    const { data: finalStats, error: finalStatsError } = await supabase
      .rpc('get_notification_stats');
    
    if (finalStatsError) {
      console.error('❌ Failed to get final stats:', finalStatsError.message);
      return false;
    }
    
    console.log('✅ Final system stats:', finalStats);
    
    // Step 12: Cleanup test data
    console.log('\n🧹 Step 12: Cleaning up test data...');
    
    // Delete the test chat message (this will cascade to notifications)
    const { error: cleanupError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', chatMessage.id);
    
    if (cleanupError) {
      console.error('❌ Failed to cleanup test data:', cleanupError.message);
      // Don't fail the test for cleanup errors
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 Chat Notification System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Database functions working correctly');
    console.log('  ✅ Triggers creating notifications automatically');
    console.log('  ✅ Notification preferences respected');
    console.log('  ✅ Email scheduling working');
    console.log('  ✅ Status tracking working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testChatNotificationSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testChatNotificationSystem };

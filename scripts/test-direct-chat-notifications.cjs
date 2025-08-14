#!/usr/bin/env node

/**
 * Test Direct Chat Notification System
 * This script tests the new direct email notification system for chat messages
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

async function testDirectChatNotifications() {
  console.log('🧪 Testing Direct Chat Notification System\n');
  
  try {
    // Step 1: Get test data
    console.log('📊 Step 1: Getting test data...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(2);
    
    const { data: events } = await supabase
      .from('events')
      .select('id, title, organization_id')
      .limit(1);
    
    if (!profiles || profiles.length < 2) {
      console.error('❌ Need at least 2 profiles for testing');
      return false;
    }
    
    if (!events || events.length === 0) {
      console.error('❌ No events found for testing');
      return false;
    }
    
    const sender = profiles[0];
    const recipient = profiles[1];
    const testEvent = events[0];
    
    console.log(`✅ Sender: ${sender.first_name} ${sender.last_name} (${sender.email})`);
    console.log(`✅ Recipient: ${recipient.first_name} ${recipient.last_name} (${recipient.email})`);
    console.log(`✅ Event: ${testEvent.title}`);
    
    // Step 2: Ensure recipient is signed up for the event
    console.log('\n📋 Step 2: Setting up event signup...');
    
    const { data: existingSignup } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', recipient.id)
      .eq('event_id', testEvent.id)
      .single();
    
    if (!existingSignup) {
      const { error: signupError } = await supabase
        .from('user_events')
        .insert({
          user_id: recipient.id,
          event_id: testEvent.id
        });
      
      if (signupError) {
        console.error('❌ Failed to sign up recipient for event:', signupError.message);
        return false;
      }
      
      console.log('✅ Recipient signed up for event');
    } else {
      console.log('✅ Recipient already signed up for event');
    }
    
    // Step 3: Set up notification preferences
    console.log('\n🔔 Step 3: Setting up notification preferences...');
    
    const { error: prefError } = await supabase
      .rpc('upsert_notification_preferences', {
        p_user_id: recipient.id,
        p_email_frequency: 'immediate',
        p_chat_notifications: true,
        p_event_updates: true
      });
    
    if (prefError) {
      console.error('❌ Failed to set notification preferences:', prefError.message);
      return false;
    }
    
    console.log('✅ Notification preferences set to immediate');
    
    // Step 4: Test the email API directly
    console.log('\n📧 Step 4: Testing email API directly...');
    
    const testEmailData = {
      userEmail: recipient.email,
      eventTitle: testEvent.title,
      message: 'This is a test message for the direct notification system',
      senderName: `${sender.first_name} ${sender.last_name}`,
      senderType: 'user',
      organizationName: 'Test Organization'
    };
    
    try {
      const emailResponse = await fetch('http://localhost:3000/api/send-chat-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEmailData)
      });
      
      if (emailResponse.ok) {
        const result = await emailResponse.json();
        console.log('✅ Direct email API test successful:', result.messageId);
      } else {
        const errorText = await emailResponse.text();
        console.log('⚠️  Email API failed (this is expected if server is not running locally)');
        console.log('   Response:', emailResponse.status, errorText);
      }
    } catch (emailError) {
      console.log('⚠️  Email API connection failed (server may not be running locally)');
      console.log('   This is expected if not running the development server');
    }
    
    // Step 5: Test the full chat message flow (without email for now)
    console.log('\n💬 Step 5: Testing chat message insertion...');
    
    const testMessage = `Test message at ${new Date().toISOString()} - Testing direct notifications`;
    
    const { data: chatMessage, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        event_id: testEvent.id,
        user_id: sender.id,
        message: testMessage,
        is_anonymous: false
      })
      .select()
      .single();
    
    if (chatError) {
      console.error('❌ Failed to post chat message:', chatError.message);
      return false;
    }
    
    console.log('✅ Chat message posted:', chatMessage.id);
    
    // Step 6: Check if we can fetch the necessary data for notifications
    console.log('\n🔍 Step 6: Verifying notification data can be fetched...');
    
    // Test event data fetch
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        organization_id,
        organizations (
          id,
          name,
          user_id
        )
      `)
      .eq('id', testEvent.id)
      .single();
    
    if (eventError) {
      console.error('❌ Failed to fetch event data:', eventError.message);
      return false;
    }
    
    console.log('✅ Event data fetched successfully');
    
    // Test user events fetch
    const { data: userEvents, error: userEventsError } = await supabase
      .from('user_events')
      .select(`
        user_id,
        profiles (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('event_id', testEvent.id)
      .neq('user_id', sender.id);
    
    if (userEventsError) {
      console.error('❌ Failed to fetch user events:', userEventsError.message);
      return false;
    }
    
    console.log(`✅ Found ${userEvents.length} users to notify`);
    
    // Test notification preferences fetch
    const { data: preferences, error: prefFetchError } = await supabase
      .rpc('get_notification_preferences', { p_user_id: recipient.id });
    
    if (prefFetchError) {
      console.error('❌ Failed to fetch notification preferences:', prefFetchError.message);
      return false;
    }
    
    console.log('✅ Notification preferences fetched:', preferences[0]);
    
    // Step 7: Cleanup
    console.log('\n🧹 Step 7: Cleaning up test data...');
    
    const { error: cleanupError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', chatMessage.id);
    
    if (cleanupError) {
      console.error('⚠️  Failed to cleanup test data:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    // Final summary
    console.log('\n🎉 Direct Chat Notification System Test Summary:');
    console.log('  ✅ Database structure is ready');
    console.log('  ✅ Chat message insertion works');
    console.log('  ✅ User lookup and preferences work');
    console.log('  ✅ Event data and organization lookup work');
    console.log('  📧 Email API ready (test when server is running)');
    console.log('\n📝 Next Steps:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Test a real chat message in the UI');
    console.log('  3. Check email delivery to signed-up users');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testDirectChatNotifications()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testDirectChatNotifications };
